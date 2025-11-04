/**
 * API Service
 *
 * Core HTTP communication layer for all API requests.
 * Centralizes HTTP client logic and provides a unified interface for backend communication.
 *
 * Key Features:
 * - Generic request method supporting all HTTP verbs
 * - Automatic URL construction with base URL from environment
 * - Response unwrapping (handles both wrapped and raw responses)
 * - Query parameter sanitization
 * - Request/response logging for debugging
 * - Support for custom headers
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';

/** Type definition for HTTP methods */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Response wrapper type
 * Backend may return either:
 * - Wrapped format: { data: T, error?: any }
 * - Raw format: T
 */
type MaybeWrapped<T> = T | { data: T; error?: any };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generic HTTP request method
   *
   * Handles all HTTP operations (GET, POST, PUT, PATCH, DELETE) with:
   * - Automatic URL construction from base URL
   * - Query parameter handling and sanitization
   * - Custom header support
   * - Response unwrapping and transformation
   * - Console logging for debugging
   *
   * @template T - Expected response data type
   * @param {HttpMethod} method - HTTP method to use
   * @param {string} url - Endpoint path (appended to base URL)
   * @param {any} [data] - Request body (for POST, PUT, PATCH)
   * @param {Record<string, any>} [params] - Query parameters
   * @param {HttpHeaders} [headers] - Custom HTTP headers
   * @returns {Observable<T>} Observable of the response data
   *
   * @example
   * // GET request
   * this.api.request<Construction[]>('GET', 'construction')
   *
   * @example
   * // POST with data
   * this.api.request<Construction>('POST', 'construction', newConstruction)
   *
   * @example
   * // GET with query parameters
   * this.api.request<Element[]>('GET', 'element', undefined, { skip: 0, take: 10 })
   */
  request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Observable<T> {
    const fullUrl = `${this.baseUrl}/${url}`;

    // Sanitize query parameters: convert all values to strings and remove null/undefined
    const sanitizedParamsObj: Record<string, string> = {};
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sanitizedParamsObj[k] = String(v);
    });

    // Build HTTP request options
    const options = {
      headers:
        headers ?? new HttpHeaders({ 'Content-Type': 'application/json' }),
      params: new HttpParams({ fromObject: sanitizedParamsObj }),
      body: data !== undefined ? data : undefined,
    } as const;

    // Execute HTTP request
    const req$ = this.http.request<MaybeWrapped<T>>(method, fullUrl, options);
    return req$.pipe(
      // Log request/response for debugging
      tap((resp) => {
        console.groupCollapsed(`[API] ${method} ${fullUrl}`);
        if (data !== undefined) console.log('Body:', data);
        if (Object.keys(sanitizedParamsObj).length)
          console.log('Params:', sanitizedParamsObj);
        console.log('Response:', resp);
        console.groupEnd();
      }),
      // Unwrap response data if wrapped in { data, error } format
      map((resp: any) => ('data' in resp ? (resp.data as T) : (resp as T)))
    );
  }
}
