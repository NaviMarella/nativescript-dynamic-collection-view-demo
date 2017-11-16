import { Component, NgZone, OnInit } from "@angular/core";
import { ObservableArray } from "data/observable-array";
import { RouterExtensions } from "nativescript-angular/router";
import { ListViewEventData, RadListView } from "nativescript-pro-ui/listview";

import { Car } from "./shared/car.model";
import { CarService } from "./shared/car.service";

import "rxjs/add/observable/of";
import "rxjs/add/operator/delay";
import { Observable } from "rxjs/Observable";

import { debounce, noop } from "lodash";
import { myUICollectionViewDelegate as MyUICollectionViewDelegate } from "../my-ui-collection-view-delegate";

/* ***********************************************************
* This is the master list component in the master-detail structure.
* This component gets the data, passes it to the master view and displays it in a list.
* It also handles the navigation to the details page for each item.
*************************************************************/
@Component({
    selector: "CarsList",
    moduleId: module.id,
    templateUrl: "./car-list.component.html",
    styleUrls: ["./car-list.component.css"]
})
export class CarListComponent implements OnInit {
    private _isLoading: boolean = false;
    private _isLoadingOnDemand = false;
    private _cars: ObservableArray<Car> = new ObservableArray<Car>([]);
    private _listView: RadListView;
    private _tearDownLoadOnDemand: () => void;

    constructor(
        private _carService: CarService,
        private _routerExtensions: RouterExtensions,
        private _ngZone: NgZone
    ) {}

    onListViewLoaded(args: ListViewEventData) {
        this._listView = args.object;
        this._listView.ios.delegate = MyUICollectionViewDelegate.initWithOwner(new WeakRef(this._listView));
    }

    /* ***********************************************************
    * Use the "ngOnInit" handler to get the data and assign it to the
    * private property that holds it inside the component.
    *************************************************************/
    ngOnInit(): void {
        this._isLoading = true;

        /* ***********************************************************
        * The data is retrieved remotely from FireBase.
        * The actual data retrieval code is wrapped in a data service.
        * Check out the service in cars/shared/car.service.ts
        *************************************************************/
        this._carService.load()
            .finally(() => this._isLoading = false)
            .subscribe((cars: Array<Car>) => {
                this._cars = new ObservableArray(cars);
                this._isLoading = false;
            });
    }

    get cars(): ObservableArray<Car> {
        return this._cars;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    onLoadMoreItemsRequested(args: ListViewEventData) {
        if (this._isLoadingOnDemand) {
            return;
        }

        this._isLoadingOnDemand = true;

        Observable.from(this._cars.slice(0, 9))
            .delay(1000)
            .subscribe(
                (car: Car) => {
                    this._ngZone.run(() => {
                        this._cars.push(car);
                    });
                },
                this.tearDownLoadOnDemand,
                this.tearDownLoadOnDemand
            );

        args.returnValue = true;
    }

    /* ***********************************************************
    * Use the "itemTap" event handler of the <RadListView> to navigate to the
    * item details page. Retrieve a reference for the data item (the id) and pass it
    * to the item details page, so that it can identify which data item to display.
    * Learn more about navigating with a parameter in this documentation article:
    * http://docs.nativescript.org/angular/core-concepts/angular-navigation.html#passing-parameter
    *************************************************************/
    onCarItemTap(args: ListViewEventData): void {
        const tappedCarItem = args.view.bindingContext;

        this._routerExtensions.navigate(["/cars/car-detail", tappedCarItem.id],
        {
            animated: true,
            transition: {
                name: "slide",
                duration: 200,
                curve: "ease"
            }
        });
    }

    get tearDownLoadOnDemand() {
        if (!this._listView) {
            return noop;
        } else if (!this._tearDownLoadOnDemand) {
            this._tearDownLoadOnDemand = debounce(() => {
                this._isLoadingOnDemand = false;
                this._listView.notifyLoadOnDemandFinished();
            }, 300);
        }

        return this._tearDownLoadOnDemand;
    }
}
