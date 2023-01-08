import { Component } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NgToastService } from "ng-angular-popup";
import { FirebaseService } from "src/app/services/database/firebase";

export function passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
  
      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordsDontMatch: true };
      } else {
        return null;
      }
    };
  }

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

    registerForm = new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required]),
        confirmPassword: new FormControl('', Validators.required),
    },
    {
        validators: passwordsMatchValidator()
    });
    
    constructor(
      public firebaseService: FirebaseService,
      public toast: NgToastService,
      public router: Router
    ){

    }

    get email() {
        return this.registerForm.get('email');
    }

    get name() {
      return this.registerForm.get('name');
  }

    get password() {
        return this.registerForm.get('password');
    }

    get confirmPassword() {
      return this.registerForm.get('confirmPassword');
    }

    async submit() {
        console.log("merge")
        const { name, email, password } = this.registerForm.value;
    
        if (!this.registerForm.valid || !name || !password || !email) {
          return;
        }
    
        await this.firebaseService.register(email, password).then(() => {
          this.router.navigate(['/map']);
          this.toast.success({detail:'Success',summary:'You are registered!', position:'tr', duration: 2000})
        }).catch(() => this.toast.error({detail:'Error',summary:'Existing account.', position:'tr', duration: 2000})); 
            
      }
}