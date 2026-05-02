import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import {
  Library,
  LibraryItem,
  LibraryItemsResponse,
  ListeningSession,
  PersonalizedShelf,
  Series,
  SeriesResponse,
  ABSUser
} from '../models/abs.models';

@Injectable({ providedIn: 'root' })
export class AudiobookshelfService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get baseUrl(): string {
    return this.auth.serverUrl();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token()}` });
  }

  private get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers, params });
  }

  coverUrl(itemId: string): string {
    return `${this.baseUrl}/api/items/${itemId}/cover?token=${this.auth.token()}`;
  }

  seriesCoverUrl(libraryId: string, seriesId: string): string {
    return `${this.baseUrl}/api/libraries/${libraryId}/series/${seriesId}/cover?token=${this.auth.token()}`;
  }

  getLibraries(): Observable<Library[]> {
    return this.get<{ libraries: Library[] }>('/api/libraries').pipe(
      map(r => r.libraries)
    );
  }

  getPersonalizedShelves(libraryId: string): Observable<PersonalizedShelf[]> {
    return this.get<PersonalizedShelf[]>(`/api/libraries/${libraryId}/personalized`);
  }

  getLibraryItems(
    libraryId: string,
    options: {
      limit?: number;
      page?: number;
      sort?: string;
      desc?: boolean;
      filter?: string;
      search?: string;
      include?: string;
    } = {}
  ): Observable<LibraryItemsResponse> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 40))
      .set('page', String(options.page ?? 0))
      .set('include', options.include ?? 'progress');

    if (options.sort) params = params.set('sort', options.sort);
    if (options.desc !== undefined) params = params.set('desc', options.desc ? '1' : '0');
    if (options.filter) params = params.set('filter', options.filter);
    if (options.search) params = params.set('search', options.search);

    return this.get<LibraryItemsResponse>(`/api/libraries/${libraryId}/items`, params);
  }

  getSeries(
    libraryId: string,
    options: { limit?: number; page?: number; sort?: string; desc?: boolean } = {}
  ): Observable<SeriesResponse> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 40))
      .set('page', String(options.page ?? 0))
      .set('include', 'progress');

    if (options.sort) params = params.set('sort', options.sort);
    if (options.desc !== undefined) params = params.set('desc', options.desc ? '1' : '0');

    return this.get<SeriesResponse>(`/api/libraries/${libraryId}/series`, params);
  }

  getSeriesItems(libraryId: string, seriesId: string): Observable<LibraryItemsResponse> {
    const filter = `series.${btoa(seriesId)}`;
    return this.getLibraryItems(libraryId, { filter, limit: 100, include: 'progress' });
  }

  getCurrentUser(): Observable<ABSUser> {
    return this.get<ABSUser>('/api/me');
  }

  getListeningSessions(itemsPerPage = 100, page = 0): Observable<{ sessions: ListeningSession[]; total: number }> {
    const params = new HttpParams()
      .set('itemsPerPage', String(itemsPerPage))
      .set('page', String(page));
    return this.get<{ sessions: ListeningSession[]; total: number }>('/api/me/listening-sessions', params);
  }
}
