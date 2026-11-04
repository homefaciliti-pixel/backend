const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const files = ['api.txt', 'api_endpoints.txt', 'apitxt'];

const oldSnippet = `GET /api/categories
- Response: 
{
  "success": true,
  "message": "Services fetched successfully",
  "data": {
    "categories": [
      {
        "categoryId": "7",
        "categoryName": "Cleaning",
        "categoryImage": "https://...",
        "status": "active",
        "services": [
          {
            "serviceId": "101",
            "productDbId": "101",
            "title": "Deep Home Cleaning",
            "subtitle": "Complete home deep cleaning",
            "description": "...",
            "image": "https://...",
            "categoryId": "7",
            "status": "active",
            "rating": 4.8,
            "reviewsCount": 245,
            "discount": 10,
            "cutPrice": 1499,
            "price": 1349,
            "hasVariants": true,
            "variants": [
              {
                "variantId": "1011",
                "name": "1 BHK",
                "description": "Deep cleaning for 1 BHK home",
                "price": 999,
                "cutPrice": 1199,
                "discount": 17,
                "duration": 180,
                "status": "active"
              }
            ]
          }
        ]
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}

POST /api/categories`;

const newSnippet = `GET /api/categories
- Query Parameters:
  - \`page\` (optional): Page number for pagination (default: 1)
  - \`limit\` (optional): Categories per page (default: 20)
  - \`flat\` (optional): Set to "true" if flat category list is needed without top-level nesting
- Response: 
{
  "success": true,
  "message": "Services fetched successfully",
  "data": {
    "categories": [
      {
        "categoryId": "7",
        "categoryName": "Cleaning",
        "categoryImage": "https://...",
        "parent": "Main Category",
        "status": "active",
        "subCategories": [
          {
            "subCategoryId": "701",
            "categoryId": "701",
            "subCategoryName": "Full Home Deep Cleaning",
            "categoryName": "Full Home Deep Cleaning",
            "subCategoryImage": "https://...",
            "categoryImage": "https://...",
            "parent": "Cleaning",
            "status": "active",
            "services": [ ... ]
          }
        ],
        "services": [
          {
            "serviceId": "101",
            "productDbId": "101",
            "title": "Deep Home Cleaning",
            "subtitle": "Complete home deep cleaning",
            "description": "...",
            "image": "https://...",
            "categoryId": "7",
            "status": "active",
            "rating": 4.8,
            "reviewsCount": 245,
            "discount": 10,
            "cutPrice": 1499,
            "price": 1349,
            "hasVariants": true,
            "variants": [
              {
                "variantId": "1011",
                "name": "1 BHK",
                "description": "Deep cleaning for 1 BHK home",
                "price": 999,
                "cutPrice": 1199,
                "discount": 17,
                "duration": 180,
                "status": "active"
              }
            ]
          }
        ]
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}

GET /api/subcategories
- Query Parameters:
  - \`parent\` (optional): Filter subcategories by parent category name or ID
- Response:
{
  "success": true,
  "message": "Subcategories fetched successfully",
  "total": 2,
  "subcategories": [
    {
      "subCategoryId": "701",
      "categoryId": "701",
      "subCategoryName": "Full Home Deep Cleaning",
      "categoryName": "Full Home Deep Cleaning",
      "subCategoryImage": "https://...",
      "categoryImage": "https://...",
      "parent": "Cleaning",
      "status": "active"
    }
  ]
}

GET /api/categories/:category/subcategories
- Path Parameter: category (e.g., "Cleaning", "Plumber", "7")
- Response:
{
  "success": true,
  "category": "Cleaning",
  "total": 1,
  "subcategories": [
    {
      "subCategoryId": "701",
      "categoryId": "701",
      "subCategoryName": "Full Home Deep Cleaning",
      "categoryName": "Full Home Deep Cleaning",
      "subCategoryImage": "https://...",
      "categoryImage": "https://...",
      "parent": "Cleaning",
      "status": "active"
    }
  ]
}

POST /api/categories`;

files.forEach(f => {
  const filePath = path.join(baseDir, f);
  if (fs.existsSync(filePath)) {
    let raw = fs.readFileSync(filePath, 'utf8');
    const normRaw = raw.replace(/\r\n/g, '\n');
    const normOld = oldSnippet.replace(/\r\n/g, '\n');
    const normNew = newSnippet.replace(/\r\n/g, '\n');

    if (normRaw.includes(normOld)) {
      let updated = normRaw.replace(normOld, normNew);
      if (raw.includes('\r\n')) {
        updated = updated.replace(/\n/g, '\r\n');
      }
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Successfully updated ${f}`);
    } else {
      console.warn(`Old snippet not matched in ${f}`);
    }
  }
});
