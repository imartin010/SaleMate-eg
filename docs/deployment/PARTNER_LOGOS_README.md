# 🎨 Partner Logos Implementation Guide

## 📁 Logo File Structure

All partner logos should be stored in the `partners-logos` storage bucket with the following naming convention:

```
partners-logos/
├── the-address-investments-logo.png
├── bold-routes-logo.png
├── nawy-logo.png
├── cb-link-logo.png
└── salemate-logo.png
```

## 🖼️ Logo Specifications

### **File Requirements:**
- **Format**: PNG, JPEG, JPG, or SVG (recommended: PNG with transparency)
- **Size**: Maximum 5MB per file
- **Dimensions**: Recommended 200x200px minimum, 400x400px optimal
- **Background**: Transparent or white background preferred
- **Quality**: High resolution for crisp display

### **Current Partners & Logo Paths:**

| Partner | Logo Path | Status | Description |
|---------|-----------|--------|-------------|
| **The Address Investments** | `partners-logos/the-address-investments-logo.png` | 🔄 Needs Logo | Leading real estate investment firm |
| **Bold Routes** | `partners-logos/bold-routes-logo.png` | 🔄 Needs Logo | Innovative real estate solutions |
| **Nawy** | `partners-logos/nawy-logo.png` | 🔄 Needs Logo | Digital real estate platform |
| **CB Link by Coldwell Banker** | `partners-logos/cb-link-logo.png` | 🔄 Needs Logo | Global real estate franchise |
| **SaleMate** | `partners-logos/salemate-logo.png` | 🔄 Needs Logo | Leading real estate platform |

## 🚀 Implementation Steps

### **Step 1: Upload Logos to Supabase Storage**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo)
2. Navigate to **Storage** → **partners-logos** bucket
3. Upload each logo file with the exact naming convention above

### **Step 2: Apply Database Migration**
```bash
npx supabase db push
```

### **Step 3: Verify Logo Display**
- Check the Partners page to ensure logos are displaying correctly
- Verify that logo paths are properly stored in the database

## 🔧 Technical Details

### **Storage Bucket Configuration:**
- **Bucket ID**: `partners-logos`
- **Public Access**: ✅ Yes (logos are publicly viewable)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: PNG, JPEG, JPG, SVG

### **Database Schema:**
```sql
partners table:
- logo_path: TEXT (stores the full path to the logo)
- Example: 'partners-logos/salemate-logo.png'
```

### **Frontend Integration:**
- Logos are displayed in the Partners page
- Fallback to emoji icons if logos are not available
- Responsive design for different screen sizes

## 📱 Logo Display in Frontend

The logos are integrated into the following components:
- `src/pages/Partners/PartnersPage.tsx` - Main partners listing
- `src/pages/Partners/Partners.tsx` - Alternative partners view
- Partner cards and commission displays

## 🎯 Next Steps

1. **Design/Obtain Logos**: Create or source professional logos for each partner
2. **Upload to Storage**: Use Supabase Dashboard to upload logo files
3. **Apply Migration**: Run the database migration to update logo paths
4. **Test Display**: Verify logos appear correctly on the frontend
5. **Optimize**: Ensure logos are properly sized and optimized for web

## 🔍 Troubleshooting

### **Common Issues:**
- **Logo not displaying**: Check if the file path is correct in the database
- **Permission errors**: Ensure you have admin access to upload files
- **File size issues**: Compress logos to stay under 5MB limit
- **Format problems**: Convert to PNG if having display issues

### **Debug Commands:**
```sql
-- Check current logo paths
SELECT name, logo_path FROM partners;

-- Verify storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'partners-logos';
```

## 📞 Support

If you encounter any issues with logo implementation:
1. Check the Supabase logs for errors
2. Verify file permissions and storage policies
3. Ensure database migration was applied successfully
4. Test logo URLs directly in the browser

---

**Last Updated**: Current session
**Status**: Ready for logo uploads
