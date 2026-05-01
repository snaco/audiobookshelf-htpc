import { useState, useEffect, useCallback, useRef } from 'react'

interface GamepadState {
  id: string
  index: number
  buttons: boolean[]
  axes: number[]
  triggers: { left: number; right: number }
  controllerType: 'standard' | 'dualsense' | 'dualsense-edge' | 'xbox' | 'unknown'
}

const CONTROLLER_MAPPINGS: Record<string, GamepadState['controllerType']> = {
  'dualsense': 'dualsense',
  'dualsense edge': 'dualsense-edge',
  'wireless controller': 'dualsense',
  'xbox': 'xbox',
  'playstation': 'dualsense',
}

function detectControllerType(gamepadId: string): GamepadState['controllerType'] {
  const lowerId = gamepadId.toLowerCase()
  for (const [key, type] of Object.entries(CONTROLLER_MAPPINGS)) {
    if (lowerId.includes(key)) {
      return type
    }
  }
  return 'unknown'
}

function processGamepadInput(gamepad: Gamepad, controllerType: GamepadState['controllerType']) {
  const buttons = gamepad.buttons.map(b => b.pressed)
  let axes = [...gamepad.axes]
  let triggers = { left: 0, right: 0 }

  // DualSense Edge: L2/R2 are analog triggers on buttons 6 and 7
  if (controllerType === 'dualsense' || controllerType === 'dualsense-edge') {
    // Extract trigger values from button values (analog)
    if (gamepad.buttons.length >= 8) {
      triggers.left = gamepad.buttons[6].value
      triggers.right = gamepad.buttons[7].value
    }
  } else {
    // Standard controllers: triggers might be on axes or as button values
    if (axes.length >= 4) {
      triggers.left = (axes[2] + 1) / 2
      triggers.right = (axes[3] + 1) / 2
      axes = axes.slice(0, 2)
    }
  }

  return { buttons, axes, triggers }
}

export function useGamepad() {
  const [gamepads, setGamepads] = useState<Map<number, GamepadState>>(new Map())
  const [connected, setConnected] = useState(false)
  const previousGamepadsRef = useRef<Map<number, GamepadState>>(new Map())
  const controllerTypesRef = useRef<Map<number, GamepadState['controllerType']>>(new Map())

  const handleGamepadConnected = useCallback((e: GamepadEvent) => {
    const controllerType = detectControllerType(e.gamepad.id)
    controllerTypesRef.current.set(e.gamepad.index, controllerType)
    console.log('Gamepad connected:', e.gamepad.id, 'Type:', controllerType)
    setConnected(true)
  }, [])

  const handleGamepadDisconnected = useCallback((e: GamepadEvent) => {
    console.log('Gamepad disconnected:', e.gamepad)
    controllerTypesRef.current.delete(e.gamepad.index)
    setGamepads(prev => {
      const next = new Map(prev)
      next.delete(e.gamepad.index)
      return next
    })
    setConnected(false)
  }, [])

  useEffect(() => {
    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
    }
  }, [handleGamepadConnected, handleGamepadDisconnected])

  useEffect(() => {
    const updateGamepads = () => {
      const navigatorGamepads = navigator.getGamepads ? navigator.getGamepads() : []
      const newGamepads = new Map<number, GamepadState>()

      for (const gamepad of navigatorGamepads) {
        if (gamepad) {
          const controllerType = controllerTypesRef.current.get(gamepad.index) || detectControllerType(gamepad.id)
          
          const { buttons, axes, triggers } = processGamepadInput(gamepad, controllerType)
          
          newGamepads.set(gamepad.index, {
            id: gamepad.id,
            index: gamepad.index,
            buttons,
            axes,
            triggers,
            controllerType
          })

          // Check for button changes
          const prevGamepad = previousGamepadsRef.current.get(gamepad.index)
          if (prevGamepad) {
            buttons.forEach((pressed, buttonIndex) => {
              if (pressed !== prevGamepad.buttons[buttonIndex]) {
                console.log(`Button ${buttonIndex} ${pressed ? 'pressed' : 'released'}`)
              }
            })

            // Check for axis changes
            axes.forEach((value, axisIndex) => {
              if (Math.abs(value - prevGamepad.axes[axisIndex]) > 0.1) {
                console.log(`Axis ${axisIndex}: ${value.toFixed(2)}`)
              }
            })

            // Check for trigger changes
            if (Math.abs(triggers.left - prevGamepad.triggers.left) > 0.05) {
              console.log(`Left Trigger: ${(triggers.left * 100).toFixed(0)}%`)
            }
            if (Math.abs(triggers.right - prevGamepad.triggers.right) > 0.05) {
              console.log(`Right Trigger: ${(triggers.right * 100).toFixed(0)}%`)
            }
          }
        }
      }

      previousGamepadsRef.current = newGamepads
      setGamepads(newGamepads)
      setConnected(newGamepads.size > 0)
    }

    const interval = setInterval(updateGamepads, 16) // ~60fps
    return () => clearInterval(interval)
  }, [])

  return { gamepads, connected }
}
