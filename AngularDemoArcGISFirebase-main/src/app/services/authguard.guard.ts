import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from './database/firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthguardGuard implements CanActivate {
  constructor(public firebaseService: FirebaseService, public router: Router) {
    
  }
  canActivate(): boolean {
    if(!this.firebaseService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false
    }

    return true
  }
  
}
