# Bulk Stock Entry Feature

## Overview

The Bulk Stock Entry feature allows you to quickly add or update multiple stock items at once, either by:
1. **Manual Entry**: Spreadsheet-like interface where you type in rows
2. **CSV Import**: Upload a CSV file with your stock data

This is perfect for when you receive stock data that needs to be manually entered, or when you have spreadsheet data to import.

## How to Access

1. Navigate to **Stock** page (from sidebar)
2. Click the **"📊 Bulk Entry"** button at the top
3. Choose your entry method

## Method 1: Spreadsheet-Style Manual Entry

The interface looks like your spreadsheet with columns:
- **SKU Code**: Enter the SKU code (e.g., `WATCH-6-44-BLK`, `Pixel7-screen`)
- **Part Type**: Select from dropdown (Screen, Cover, Ring, Band, etc.)
- **Quantity**: Enter the stock quantity
- **Threshold**: Enter low stock threshold (default: 5)

### Features:
- **Add Rows**: Click "+ Add Row" to add more entries
- **Remove Rows**: Click the × button to remove a row
- **Real-time Validation**: Shows count of valid rows ready to submit

### Example:
```
SKU Code              | Part Type | Quantity | Threshold
WATCH-6-44-BLK        | SCREEN    | 50       | 5
Pixel7-screen         | SCREEN    | 100      | 10
IP-14-Screen          | SCREEN    | 40       | 5
```

## Method 2: CSV Import

Upload a CSV file that matches your spreadsheet format.

### Supported CSV Formats:

#### Format 1: Simple (SKU, Part Type, Quantity, Threshold)
```csv
SKU Code,Part Type,Quantity,Threshold
WATCH-6-44-BLK,SCREEN,50,5
Pixel7-screen,SCREEN,100,10
IP-14-Screen,SCREEN,40,5
```

#### Format 2: With Headers (matches your spreadsheets)
```csv
Item,Box,Quality per Box,Total
WATCH-6-44-BLK,1,50,50
Pixel7-screen,20,5,100
IP-14-Screen,40,25,1000
```

The import will:
- Skip the header row
- Try to auto-detect part types
- Extract quantities from "Box" or "Quantity" columns
- Allow you to fill in missing part types manually after import

### CSV Tips:
- Can be comma-separated (`.csv`) or tab-separated (Excel export)
- Handles quoted values
- Works with Excel exports (just save as CSV)
- Headers are optional but helpful

### After Import:
- Imported rows are added to your manual entry table
- Review and verify the data
- Select part types where needed (if not auto-detected)
- Click "Update Stock" when ready

## How It Works

1. **Enter/Import Data**: Type rows or upload CSV
2. **Review**: Check SKU codes and quantities
3. **Select Part Types**: Choose from dropdown if not auto-detected
4. **Submit**: Click "Update Stock" button
5. **Processing**: 
   - Validates each SKU exists in database
   - Checks part types are valid
   - Updates stock for each valid item
   - Shows progress and results

## Error Handling

The system will:
- ✅ **Successfully update** valid entries
- ⚠️ **Skip and report** invalid entries with specific errors:
  - SKU not found
  - Invalid part type
  - Invalid quantity
- 📊 **Show summary**: "Successfully updated X items (Y errors)"

## Best Practices

### For Manual Entry:
1. Start with a few rows to test
2. Use copy-paste from your spreadsheet if needed
3. Verify SKU codes match your database exactly
4. Check part type selection before submitting

### For CSV Import:
1. **Prepare your CSV**:
   - Include header row if possible
   - Ensure SKU codes match your database
   - Include part type names if you know them
2. **First import**: Test with a small file (5-10 rows)
3. **Review imported data**: Check that columns mapped correctly
4. **Fill in gaps**: Select part types for rows that need them
5. **Submit**: Update stock all at once

### Tips:
- SKU codes are case-insensitive (automatically converted to uppercase)
- Part types must match exactly (SCREEN, COVER, RING, BAND, etc.)
- Quantities must be whole numbers (integers)
- Threshold defaults to 5 if not specified

## Example Workflow

**Scenario**: You receive a shipment with new stock data in a spreadsheet

1. **Option A - CSV Import**:
   - Save spreadsheet as CSV
   - Go to Stock → Bulk Entry → Upload CSV
   - Review imported rows
   - Fill in any missing part types
   - Click "Update Stock"

2. **Option B - Manual Entry**:
   - Go to Stock → Bulk Entry
   - Type in SKU codes, select part types, enter quantities
   - Add rows as needed
   - Click "Update Stock"

Both methods work the same way - choose whichever is faster for your workflow!

## Future Enhancements

Potential improvements coming soon:
- **Excel file import** (.xlsx, .xls)
- **Image/PDF OCR** - Extract data from printed documents
- **Template download** - Pre-formatted CSV template
- **Bulk validation** - Check all SKUs before submitting
- **Save drafts** - Save and continue later

