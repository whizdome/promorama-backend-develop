const parseProducts = (products) => {
  const brandNames = [];
  const SKUs = [];

  if (typeof products === 'string') {
    const productsArray = products.split(',');

    productsArray.forEach((product) => {
      const [brandName, sku] = product.split('-');
      brandNames.push(brandName?.trim());
      SKUs.push(sku?.trim());
    });
  } else if (Array.isArray(products)) {
    products.forEach((product) => {
      brandNames.push(product.name);
      SKUs.push(product.sku);
    });
  } else {
    console.log("The argument 'products' is neither a string nor an array");
  }

  return { brandNames, SKUs };
};

module.exports = { parseProducts };
