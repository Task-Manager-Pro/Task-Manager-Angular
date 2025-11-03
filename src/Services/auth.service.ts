import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from './enviroment';
import { LoginResponse } from 'src/Interfaces/login.interface';
import { userModel } from 'src/Models/user.model';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: any;
  token: string | null = null;

  constructor(private http: HttpClient,
    private route:Router ) {}

  ngOnInit() {
    const token = localStorage.getItem('jwtToken');
    if (token && this.isTokenValid(token)) {
      this.user.isLogged = true;
    } else {
      this.logout();
    }
  }

  authenticate(user: userModel): Observable<LoginResponse> {
    const url = `${environment.apiBaseUrl}/api/login/authenticate`;
    return this.http.post<any>(url, user).pipe(
      map((response) => {
        // Handle both direct response and wrapped response
        const responseData = response.value || response;
        
        if (responseData && responseData.user && responseData.token) {
          const userData = {
            id: responseData.user.id,
            username: responseData.user.username,
            isAdmin: responseData.user.isAdmin,
            isLogged: true,
            profilePicture: responseData.user.profilePicture || ''
          };
         
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('jwtToken', responseData.token);
          
          // Extract expiration date from JWT token
          let expirationDate: Date = new Date();
          try {
            const decodedToken = JSON.parse(atob(responseData.token.split('.')[1]));
            if (decodedToken.exp) {
              expirationDate = new Date(decodedToken.exp * 1000);
            }
          } catch (error) {
            console.warn('Erro ao decodificar token:', error);
          }
          
          // Update the service user property
          this.user = {
            ...userData,
            token: responseData.token
          };
          
          return {
            token: responseData.token,
            user: userData,
            isLogged: true,
            expirationDate: expirationDate
          } as LoginResponse;
        } else {
          console.error('Resposta do servidor é inválida:', response);
          throw new Error('Resposta do servidor inválida');
        }
      }),
    );
  }
  

  setUser(user: LoginResponse | any) {
    if (user && user.user) {
      this.user = {
        ...user.user,
        isLogged: true
      };
      // Ensure localStorage is updated
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    } else {
      this.user = user;
      if (user && user.isLogged !== undefined) {
        user.isLogged = true;
      }
    }
  }

  isLoggedIn(): boolean {
    if (this.user == null && localStorage.getItem('user')) {
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }
    return !!this.user;
  }

  getUser(): any {
    return this.user;
  }

  logout() {
    this.user = null;
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    this.route.navigate(['/login']);
  }

  isTokenValid(token?: string): boolean {
    if (token === null || token === undefined) {
      return false;
    }
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp > currentTime) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
