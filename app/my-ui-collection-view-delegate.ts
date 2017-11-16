const tKListViewDelegateImpl = require(
    "nativescript-pro-ui/listview/listview"
).TKListViewDelegateImpl;

tKListViewDelegateImpl.prototype.collectionViewLayoutSizeForItemAtIndexPath = (
    collectionView: UICollectionView,
    collectionViewLayout: UICollectionViewLayout,
    indexPath: NSIndexPath
): CGSize => {
    return (collectionView as any).ar_sizeForCellWithIdentifier("DynamicHeightCell", (id, cell) => {
        const feed = (this as any).feeds[indexPath.row];
        cell.filleCellWithFeed(feed);
    });
};

export const myUICollectionViewDelegate = tKListViewDelegateImpl;
