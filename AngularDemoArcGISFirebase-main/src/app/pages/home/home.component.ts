import { EventEmitter, Component, OnInit, Output } from "@angular/core";
import { FirebaseService } from "src/app/services/database/firebase";


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    @Output() isLogout = new EventEmitter<void>()
    constructor(public firebaseService: FirebaseService) {

    }
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }

    logout() {
        this.firebaseService.logout();
        this.isLogout.emit()
    }
}