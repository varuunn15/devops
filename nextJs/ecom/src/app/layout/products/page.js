import ProductCard from "@/components/ProductCard";
import ProtectedRoute from "@/components/ProtectedRoute";

export const dynamic = "force-dynamic";

const ProductsPage = async () => {
  let products = [];
  let errorMessage = "";

  try {
    const response = await fetch("https://dummyjson.com/products", {
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Products API returned ${response.status}`);

    const data = await response.json();
    products = Array.isArray(data.products) ? data.products : [];
  } catch {
    errorMessage = "Products are unavailable right now. Please try again later.";
  }

  return (
    <ProtectedRoute>
      {errorMessage ? (
        <p role="alert" className="p-6 text-center text-red-600">
          {errorMessage}
        </p>
      ) : products.length === 0 ? (
        <p className="p-6 text-center">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </ProtectedRoute>
  );
};

export default ProductsPage;
