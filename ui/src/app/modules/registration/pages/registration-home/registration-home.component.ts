import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Store } from "@ngrx/store";
import { Observable, merge } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { PatientListDialogComponent } from "src/app/shared/dialogs";
import { TableConfig } from "src/app/shared/models/table-config.model";
import { Patient } from "src/app/shared/resources/patient/models/patient.model";
import { Visit } from "src/app/shared/resources/visits/models/visit.model";
import { VisitsService } from "src/app/shared/resources/visits/services";
import { addCurrentPatient, go } from "src/app/store/actions";
import { AppState } from "src/app/store/reducers";
import { StartVisitModelComponent } from "../../components/start-visit-model/start-visit-model.component";
import { VisitStatusConfirmationModelComponent } from "../../components/visit-status-confirmation-model/visit-status-confirmation-model.component";

@Component({
  selector: "app-registration-home",
  templateUrl: "./registration-home.component.html",
  styleUrls: ["./registration-home.component.scss"],
})
export class RegistrationHomeComponent implements OnInit {
  visits$: Observable<Visit[]>;
  visitColumns: any[];
  dataSource: any;
  loadingData: boolean = false;
  loadedData: boolean = false;
  loadingDataError: string;
  registrationTableConfig: TableConfig;
  isInfoOpen: boolean = false;
  isExpanded: boolean = true;
  isDark: boolean = false;
  documentURL: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private store: Store<AppState>,
    private visitService: VisitsService,
    private dialog: MatDialog
  ) {
    this.documentURL = "http://icare.dhis2.udsm.ac.tz/docs/";
  }

  get displayedColumns(): string[] {
    return this.visitColumns.map((visitColumn) => visitColumn.id);
  }

  ngOnInit() {
    this.loadingData = false;
    this.visitColumns = [
      { id: "index", label: "#" },
      { id: "patientName", label: "Name" },
      { id: "patientGender", label: "Gender" },
      { id: "patientAge", label: "Age" },
      { id: "locationName", label: "Location" },
      { id: "visitTypeName", label: "Visit type" },
      { id: "visitStartTime", label: "Visit date" },
      { id: "paymentType", label: "Payment Type" },
    ];

    this.registrationTableConfig = new TableConfig({
      noDataLabel: "No Registered patients",
    });
  }

  goToAddNewClientPage(event: Event, path: string): void {
    event.stopPropagation();
    this.store.dispatch(go({ path: [path] }));
  }

  getAllActiveVisits() {
    this.loadedData = false;
    this.visitService.getAllVisits().subscribe(
      (visits) => {
        this.dataSource = new MatTableDataSource(visits);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingData = false;
        this.loadedData = true;
      },
      (error) => {
        this.loadingData = false;
        this.loadedData = true;
        this.loadingDataError = error;
      }
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onSearchPatient(e: Event) {
    const patientListDialog = this.dialog.open(PatientListDialogComponent, {
      width: "800px",
    });

    patientListDialog
      .afterClosed()
      .subscribe((response: { action: string; patient: Patient }) => {
        if (response?.action === "PATIENT_SELECT") {
          this.store.dispatch(
            addCurrentPatient({
              patient: response.patient,
              isRegistrationPage: true,
            })
          );
          this.dialog
            .open(StartVisitModelComponent, {
              width: "85%",
              data: response.patient,
            })
            .afterClosed()
            .subscribe((visitDetails) => {
              if (visitDetails) {
                // TODO: Review the logics
                this.loadingData = true;
                setTimeout(() => {
                  this.loadingData = false;
                }, 100);
              } else {
                this.loadingData = true;
                setTimeout(() => {
                  this.loadingData = false;
                }, 100);
              }
            });
        }
      });
  }

  onSelectPatient(patient: Patient, e?: Event): void {
    if (e) {
      e.stopPropagation();
    }
    this.store.dispatch(
      addCurrentPatient({
        patient: { ...patient["patient"], id: patient["patient"]["uuid"] },
        isRegistrationPage: true,
      })
    );
    this.dialog
      .open(StartVisitModelComponent, {
        width: "85%",
        data: {
          patient: { ...patient["patient"], id: patient["patient"]["uuid"] },
        },
      })
      .afterClosed()
      .subscribe((visitDetails) => {
        if (visitDetails && !visitDetails?.close) {
          // TODO: Review the logics here
          this.loadingData = true;
          setTimeout(() => {
            this.loadingData = false;
          }, 100);
          // this.dialog
          //   .open(VisitStatusConfirmationModelComponent, {
          //     width: "30%",
          //     height: "190px",
          //   })
          //   .afterClosed()
          //   .subscribe(() => {
          //     this.loadingData = true;
          //     setTimeout(() => {
          //       this.loadingData = false;
          //     }, 100);
          //   });
        } else {
          this.loadingData = true;
          setTimeout(() => {
            this.loadingData = false;
          }, 100);
        }
      });
  }

  onBack(e: Event) {
    e.stopPropagation();
    this.store.dispatch(go({ path: ["/"] }));
  }

  toggleIcareHelp(event: Event): void {
    event.stopPropagation();
    this.isInfoOpen = !this.isInfoOpen;
  }

  onOpenInfo(): void {
    this.isInfoOpen = true;
  }

  onInfoClose(e): void {
    this.isInfoOpen = e;
  }

  toggleLogMonitor() {
    this.isExpanded = !this.isExpanded;
  }

  toggleTheme() {
    this.isDark = !this.isDark;
  }

  onOpenConsole() {
    this.isExpanded = !this.isExpanded;
  }
}
