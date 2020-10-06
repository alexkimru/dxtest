import { NgModule, Component, enableProdMode, ViewChild } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { DxTreeViewModule, DxTreeViewComponent, DxSortableModule } from 'devextreme-angular';
import { Service, FileSystemItem } from './app.service';


@Component({
    selector: 'demo-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [Service]
})
export class AppComponent {
    @ViewChild('treeviewDriveC') treeviewDriveC: DxTreeViewComponent;
    @ViewChild('treeviewDriveD') treeviewDriveD: DxTreeViewComponent;

    itemsDriveC: FileSystemItem[];
    itemsDriveD: FileSystemItem[];

    constructor(service: Service) {
        this.itemsDriveC = service.getItemsDriveC();
        this.itemsDriveD = service.getItemsDriveD();
    }

    onDragChange(e) {
        if(e.fromComponent === e.toComponent) {
            const fromNode = this.findNode(this.getTreeView(e.fromData), e.fromIndex);
            const toNode = this.findNode(this.getTreeView(e.toData), this.calculateToIndex(e));
            if (toNode !== null && this.isChildNode(fromNode, toNode)) {
                e.cancel = true;
            }
        }        
    }

    onDragEnd(e) {
        if(e.fromComponent === e.toComponent && e.fromIndex === e.toIndex) {
            return;
        }

        const fromTreeView = this.getTreeView(e.fromData);
        const toTreeView = this.getTreeView(e.toData);

        const fromNode = this.findNode(fromTreeView, e.fromIndex);
        const toNode = this.findNode(toTreeView, this.calculateToIndex(e));

        if(e.dropInsideItem && toNode !== null && !toNode.itemData.isDirectory) {
            return;
        }

        const fromTopVisibleNode = this.getTopVisibleNode(e.fromComponent);
        const toTopVisibleNode = this.getTopVisibleNode(e.toComponent);

        const fromItems = fromTreeView.option('items');
        const toItems = toTreeView.option('items');
        this.moveNode(fromNode, toNode, fromItems, toItems, e.dropInsideItem);

        fromTreeView.option('items', fromItems);
        toTreeView.option('items', toItems);
        fromTreeView.scrollToItem(fromTopVisibleNode);
        toTreeView.scrollToItem(toTopVisibleNode);
    }

    getTreeView(driveName) {
        return driveName === 'driveC'
            ? this.treeviewDriveC.instance
            : this.treeviewDriveD.instance;
    }

    calculateToIndex(e) {
        if(e.fromComponent != e.toComponent || e.dropInsideItem) {
            return e.toIndex;
        }
    
        return e.fromIndex >= e.toIndex
            ? e.toIndex
            : e.toIndex + 1;
    }

    findNode(treeView, index) {
        const visibleItems = [];
        this.buildVisibleNodesArray(treeView.getNodes(), visibleItems);
        if(visibleItems.length <= index) {
            return null;
        }

        return visibleItems[index];
    }

    buildVisibleNodesArray(nodes, arrayContainer) {
        for(var i = 0; i < nodes.length; i++) {
            arrayContainer.push(nodes[i]);
            if(nodes[i].expanded !== false && nodes[i].children){
                this.buildVisibleNodesArray(nodes[i].children, arrayContainer);
            }
        }
    }

    moveNode(fromNode, toNode, fromItems, toItems, isDropInsideItem) {
        const fromNodeContainingArray = this.getNodeContainingArray(fromNode, fromItems);
        const fromIndex = fromNodeContainingArray.findIndex(item => item.id == fromNode.itemData.id);                    
        fromNodeContainingArray.splice(fromIndex, 1);                

        if(isDropInsideItem) {
            toNode.itemData.items.splice(toNode.itemData.items.length, 0, fromNode.itemData);
        } else {
            const toNodeContainingArray = this.getNodeContainingArray(toNode, toItems);            
            const toIndex = toNode === null 
                ? toNodeContainingArray.length
                : toNodeContainingArray.findIndex(item => item.id == toNode.itemData.id);            
            toNodeContainingArray.splice(toIndex, 0, fromNode.itemData);
        }
    }

    getNodeContainingArray(node, rootArray) {
        return node === null || node.parent === null
            ? rootArray 
            : node.parent.itemData.items;
    }

    isChildNode(parentNode, childNode) {
        let parent = childNode.parent;
        while(parent !== null) {
            if(parent.itemData.id === parentNode.itemData.id) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }

    getTopVisibleNode(component) {
        const treeViewElement = component.element();
        const treeViewTopPosition = treeViewElement.getBoundingClientRect().top;
        const nodes = treeViewElement.querySelectorAll(".dx-treeview-node");
        for(let i = 0; i < nodes.length; i++) {
            const nodeTopPosition = nodes[i].getBoundingClientRect().top;
            if(nodeTopPosition >= treeViewTopPosition) {
                return nodes[i];
            }
        }

        return null;
    }
}

@NgModule({
    imports: [
        BrowserModule,
        DxTreeViewModule,
        DxSortableModule
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule);