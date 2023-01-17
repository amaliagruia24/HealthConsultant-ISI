import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface ITestItem {
    name: string,
    lat: number,
    lng: number
}

export interface Symptom {
    id?: string,
    name: string,
    specialitaty: string
}

export interface Speciality {
  id?: string,
  name: string,
}

export interface Hospital {
  id?: string,
  name: string,
  adress: string,
  lat: number,
  long: number,
  review: Array<Review>,
}

export interface Review {
  id?: string,
  grade: number,
  opinion: string,
}

export interface User {
  name: string,
  loc: ITestItem,
}

@Injectable()
export class FirebaseService {

    private _listFeed: Observable<any[]>;
    private _objFeed: Observable<any>;

    private _listReview: Observable<any[]>;
    private _listHospital: Observable<any[]>;
    private _listSpeciality: Observable<any[]>;
    private _listSymptom: Observable<any[]>;
    private _listUser: Observable<any[]>


    private _isLoggedIn = false;
    constructor(public db: AngularFireDatabase, public firebaseAuth: AngularFireAuth) {

    }

    async login(email: string, password: string) {
        await this.firebaseAuth.signInWithEmailAndPassword(email, password).then(res => {
            this._isLoggedIn = true
            localStorage.setItem('user', JSON.stringify(res.user))
        })
    }

    async register(email: string, password: string) {
        await this.firebaseAuth.createUserWithEmailAndPassword(email, password).then(res => {
            this._isLoggedIn = true
            console.log(this._isLoggedIn)
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
        this._listFeed = this.db.list('list').valueChanges();
        this._listReview = this.db.list('reviews').valueChanges();
        this._listHospital = this.db.list('hospitals').valueChanges();
        this._listSpeciality = this.db.list('specialities').valueChanges();
        this._listSymptom = this.db.list('symptoms').valueChanges();
        this._listUser = this.db.list('users').valueChanges();
        this._objFeed = this.db.object('obj').valueChanges();
    }

    getChangeFeedList() {
        return this._listFeed;
    }

    getChangeFeedObj() {
        return this._objFeed;
    }


  get listFeed(): Observable<any[]> {
    return this._listFeed;
  }

  set listFeed(value: Observable<any[]>) {
    this._listFeed = value;
  }

  get objFeed(): Observable<any> {
    return this._objFeed;
  }

  set objFeed(value: Observable<any>) {
    this._objFeed = value;
  }

  get listReview(): Observable<any[]> {
    return this._listReview;
  }

  set listReview(value: Observable<any[]>) {
    this._listReview = value;
  }

  get listHospital(): Observable<any[]> {
    return this._listHospital;
  }

  set listHospital(value: Observable<any[]>) {
    this._listHospital = value;
  }

  get listSpeciality(): Observable<any[]> {
    return this._listSpeciality;
  }

  set listSpeciality(value: Observable<any[]>) {
    this._listSpeciality = value;
  }

  get listSymptom(): Observable<any[]> {
    return this._listSymptom;
  }

  set listSymptom(value: Observable<any[]>) {
    this._listSymptom = value;
  }

  get listUser(): Observable<any[]> {
    return this._listUser;
  }

  set listUser(value: Observable<any[]>) {
    this._listUser = value;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: boolean) {
    this._isLoggedIn = value;
  }

  addPointItem(lat: number, lng: number) {
      let item: ITestItem = {
          name: "test",
          lat: lat,
          lng: lng
      };
      this.db.list('list').push(item);
    }

  addHospital(name: string, adress: string, lat: number, long: number) {
      let hospital : Hospital = {
        name: name,
        adress: adress,
        lat: lat,
        long: long,
        review: new Array<Review>(),
      }
      this.db.list('hospitals').push(hospital);
  }

  addUser(name: string) {
      let item: ITestItem = {
        name: "test",
        lat: 0,
        lng: 0,
      };
      let user: User = {
        name: name,
        loc: item,
      }
      this.db.list("users").push(user);
  }

  syncUserLocation(name: string, lat: number, lng: number) {
      let item: ITestItem = {
        name: "test",
        lat: lat,
        lng: lng
      };
    this.db.object('users/' + name).set([item]);
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
