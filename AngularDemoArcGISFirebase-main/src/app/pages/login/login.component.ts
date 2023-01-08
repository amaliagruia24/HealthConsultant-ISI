import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { FirebaseService } from "src/app/services/database/firebase";
import { NgToastService } from "ng-angular-popup";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit{

    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required]),
    });

    isSignedIn = false;

    constructor(
        public firebaseService: FirebaseService, 
        public router: Router, 
        public toast: NgToastService
    ){

    }

    ngOnInit(){
        if(localStorage.getItem('user') !== null) 
            this.isSignedIn = true
        else
            this.isSignedIn = false
    }

    async onRegister(email:string, password:string) {
        await this.firebaseService.register(email, password);
        if(this.firebaseService.isLoggedIn) 
            this.isSignedIn = true
    }

    async onLogin(email:string, password:string) {
        await this.firebaseService.login(email, password);
        if(this.firebaseService.isLoggedIn) 
            this.isSignedIn = true
    }

    handleLogout(){
        this.isSignedIn = false;

    }
    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }

    async submit() {
        if (!this.loginForm.valid) {
            return;
        }

        const { email, password } = this.loginForm.value;
        await this.firebaseService.login(email, password).then(() => {
            this.router.navigate(['/map']);
            this.toast.success({detail:'Success',summary:'Logged in succesfully!', position:'tr', duration: 4000})
        }).catch(() => this.toast.error({detail:'Error',summary:'Non-existent account. Please register.', position:'tr', duration: 4000}));
    }
}