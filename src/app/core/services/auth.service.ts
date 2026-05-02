import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ABSUser, LoginResponse } from '../models/abs.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(this.loadStoredToken());
  private _user = signal<ABSUser | null>(this.loadStoredUser());
  private _serverUrl = signal<string>(localStorage.getItem('abs_server_url') ?? '');

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly serverUrl = this._serverUrl.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(serverUrl: string, username: string, password: string): Observable<LoginResponse> {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    return this.http.post<LoginResponse>(`${cleanUrl}/login`, { username, password }).pipe(
      map(response => {
        // Defensively extract token — ABS puts it inside user
        const raw = response as unknown as Record<string, unknown>;
        const token =
          (response.user as ABSUser & { token?: string })?.token ??
          (raw['token'] as string | undefined);

        console.debug('[AuthService] login response keys:', Object.keys(raw));
        console.debug('[AuthService] user keys:', response.user ? Object.keys(response.user) : 'no user');
        console.debug('[AuthService] extracted token:', token ? `${token.slice(0, 10)}…` : 'MISSING');

        if (!token) {
          throw { status: 0, message: 'No auth token in server response' };
        }

        this._token.set(token);
        this._user.set(response.user);
        this._serverUrl.set(cleanUrl);
        localStorage.setItem('abs_token', token);
        localStorage.setItem('abs_server_url', cleanUrl);
        localStorage.setItem('abs_user', JSON.stringify(response.user));

        return response;
      }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('abs_token');
    localStorage.removeItem('abs_server_url');
    localStorage.removeItem('abs_user');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this._token();
  }

  refreshUser(user: ABSUser): void {
    this._user.set(user);
    localStorage.setItem('abs_user', JSON.stringify(user));
  }

  private loadStoredToken(): string | null {
    const token = localStorage.getItem('abs_token');
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem('abs_token');
      return null;
    }
    return token;
  }

  private loadStoredUser(): ABSUser | null {
    const stored = localStorage.getItem('abs_user');
    if (!stored || stored === 'undefined' || stored === 'null') return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
