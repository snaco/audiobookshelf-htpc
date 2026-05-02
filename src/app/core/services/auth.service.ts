import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError, catchError } from 'rxjs';
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
      tap(response => {
        // ABS returns the token inside user; guard against unexpected shapes
        const token: string | undefined =
          response.user?.token ?? (response as Record<string, unknown>)['token'] as string | undefined;

        if (!token) throw new Error('No token in login response');

        this._token.set(token);
        this._user.set(response.user);
        this._serverUrl.set(cleanUrl);
        localStorage.setItem('abs_token', token);
        localStorage.setItem('abs_server_url', cleanUrl);
        localStorage.setItem('abs_user', JSON.stringify(response.user));
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
    // Clear tokens that were stored as the literal string "undefined" / "null" by old code
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
