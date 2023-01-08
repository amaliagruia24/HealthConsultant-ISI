import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { EsriMapComponent } from "./pages/esri-map/esri-map.component";
import { AppRoutingModule } from "./app-routing.module";

import { environment } from "../environments/environment";
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireDatabaseModule } from "@angular/fire/compat/database";

import { FirebaseService } from "./services/database/firebase";
import { FirebaseMockService } from "./services/database/firebase-mock";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MatTabsModule } from "@angular/material/tabs";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { NgToastModule } from 'ng-angular-popup';
import { provideFirebaseApp } from "@angular/fire/app";
import { initializeApp } from "firebase/app";
import { provideAuth, getAuth } from '@angular/fire/auth';




@NgModule({
  declarations: [AppComponent, EsriMapComponent, LoginComponent, RegisterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    NgToastModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule
  ],
  providers: [
    FirebaseService,
    FirebaseMockService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
