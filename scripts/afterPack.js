// electron-builder afterPack hook.
//
// Wraps the Electron binary in a shell launcher that always passes
// Chromium flags required for the AppImage to run on Bazzite under
// gamescope (Steam game mode).
//
// Why a wrapper instead of `executableArgs` in electron-builder.json:
// the AppImage AppRun template execs the binary with only the user's $@,
// silently ignoring `executableArgs`. App-level `app.commandLine.appendSwitch`
// also doesn't help — Chromium parses --no-sandbox / --no-zygote before
// main.js runs. The flags must be on the real process argv, which is what
// this wrapper guarantees.
//
// Flag rationale:
//   --no-sandbox          AppImage FUSE squashfs cannot host a SUID
//                         chrome-sandbox helper.
//   --no-zygote           Bazzite + gamescope already runs us inside a
//                         user namespace; nested namespace clone() returns
//                         EINVAL and the zygote crashes at
//                         zygote_host_impl_linux.cc(202).
//   --disable-gpu         Skips the GPU process entirely; software
//                         rendering for the 2D Angular UI. Gamescope's
//                         Mesa/Vulkan/WSI stack interacts badly with
//                         Chromium's GPU child process (seccomp SIGSYS
//                         on get_robust_list with --disable-gpu-sandbox;
//                         silent hang without it). For an HTPC there's
//                         no video / 3D content, so software rendering
//                         is fine.

const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "linux") return;

  const binName = "audiobookshelf-htpc";
  const binPath = path.join(context.appOutDir, binName);
  const realBinPath = path.join(context.appOutDir, `${binName}.bin`);

  fs.renameSync(binPath, realBinPath);

  const wrapper = `#!/bin/bash
DIR="$(dirname "$(readlink -f "$0")")"
echo "[${binName} wrapper] exec \\"$DIR/${binName}.bin\\" --no-sandbox --no-zygote --disable-gpu" >&2
exec "$DIR/${binName}.bin" --no-sandbox --no-zygote --disable-gpu "$@"
`;
  fs.writeFileSync(binPath, wrapper, { mode: 0o755 });
};
