# Add New SKU Feature

## Overview

You can now add new SKUs directly from the "Add Item" modal without leaving the page!

## How to Use

1. **Open the "Add Item" modal** from the order list page
2. **Click the "+ New SKU" button** next to the SKU search field
3. **Fill in the SKU form:**
   - **SKU Code** (Required) - Unique identifier (e.g., "IPH14-128-SG")
   - **Brand** - e.g., "Apple"
   - **Model** - e.g., "iPhone 14"
   - **Capacity** - e.g., "128GB"
   - **Color** - e.g., "Space Gray"
   - **Carrier** - e.g., "Verizon"
   - **Device Type** - e.g., "Phone", "Tablet"
   - **Post Fix** - Optional suffix
   - **Unlocked** checkbox - Whether device is unlocked
   - **Active** checkbox - Whether SKU is active (default: checked)

4. **Click "Add SKU"** to save
5. **The new SKU is automatically selected** in the Add Item form
6. **Continue adding the item** with part type and quantity

## Features

✅ **Validation** - Prevents duplicate SKU codes  
✅ **Auto-select** - Newly created SKU is automatically selected  
✅ **Form reset** - Form clears after successful creation  
✅ **Error handling** - Clear error messages if something goes wrong  
✅ **Keyboard support** - ESC key to close modal  

## Technical Details

### Service Method
- `SKUService.addSKU()` - Handles SKU creation with validation

### Required Fields
- `sku_code` - Must be unique, required

### Optional Fields
- All other fields are optional
- Defaults: `is_active = true`, `is_unlocked = false`

### Database
- Inserts into `sku_master` table
- Uses existing table structure
- No migration needed

## User Flow

```
Add Item Modal
    ↓
Click "+ New SKU"
    ↓
Add SKU Modal Opens
    ↓
Fill Form & Submit
    ↓
SKU Created in Database
    ↓
Add Item Modal Refreshes
    ↓
New SKU Auto-Selected
    ↓
Continue Adding Item...
```

## Error Messages

- **"SKU code is required"** - SKU code field is empty
- **"SKU code 'XXX' already exists"** - Duplicate SKU code
- **"Failed to add SKU: [details]"** - Database or network error

This makes it super easy to add new products on the fly while building your order list! 🚀

