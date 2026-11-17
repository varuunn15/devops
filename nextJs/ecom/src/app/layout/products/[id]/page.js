import Image from "next/image";

export const dynamic = "force-dynamic";

const ProductPage = async ({ params }) => {
  const { id } = await params;
  let product;

  try {
    const response = await fetch(`https://dummyjson.com/products/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Product API returned ${response.status}`);
    product = await response.json();
  } catch {
    return (
      <p role="alert" className="p-6 text-center text-red-600">
        This product could not be loaded. Please try again later.
      </p>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 p-6 md:grid-cols-2">
      <Image
        src={product.thumbnail || product.images?.[0]}
        alt={product.title}
        width={600}
        height={600}
        className="h-96 w-full rounded-2xl bg-muted object-contain p-6"
      />
      <section className="space-y-4">
        <p className="text-sm capitalize text-muted-foreground">
          {product.category}
        </p>
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p>{product.description}</p>
        <p className="text-2xl font-bold">${product.price}</p>
        {product.rating != null && <p>⭐ {product.rating}</p>}
      </section>
    </main>
  );
};

export default ProductPage;
