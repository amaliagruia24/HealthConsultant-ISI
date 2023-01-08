import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface ITestItem {
    name: string,
    lat: number,
    lng: number
}

@Injectable()
export class FirebaseService {

    listFeed: Observable<any[]>;
    objFeed: Observable<any>;

    isLoggedIn = false;
    constructor(public db: AngularFireDatabase, public firebaseAuth: AngularFireAuth) {

    }

    async login(email: string, password: string) {
        await this.firebaseAuth.signInWithEmailAndPassword(email, password).then(res => {
            this.isLoggedIn = true
            localStorage.setItem('user', JSON.stringify(res.user))
        })
    }

    async register(email: string, password: string) {
        await this.firebaseAuth.createUserWithEmailAndPassword(email, password).then(res => {
            this.isLoggedIn = true
            console.log(this.isLoggedIn)
            localStorage.setItem('user', JSON.stringify(res.user))
        })
    }

    public isAuthenticated(): boolean{
        if (localStorage.getItem('user') !== null) 
            return true;
        else 
            return false;
    }

    public logout() {
        this.firebaseAuth.signOut()
        localStorage.removeItem('user')

    }

    connectToDatabase() {
        this.listFeed = this.db.list('list').valueChanges();
        this.objFeed = this.db.object('obj').valueChanges();
    }

    getChangeFeedList() {
        return this.listFeed;
    }

    getChangeFeedObj() {
        return this.objFeed;
    }

    addPointItem(lat: number, lng: number) {
        let item: ITestItem = {
            name: "test",
            lat: lat,
            lng: lng
        };
        this.db.list('list').push(item);
    }

    syncPointItem(lat: number, lng: number) {
        let item: ITestItem = {
            name: "test",
            lat: lat,
            lng: lng
        };
        this.db.object('obj').set([item]);
    }
}