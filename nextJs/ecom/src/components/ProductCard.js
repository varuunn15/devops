"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProductCard = ({ product }) => {
  const image = product.thumbnail || product.images?.[0] || product.image;
  const rating = product.rating?.rate ?? product.rating;

  return (
    <Card className="group overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:shadow-xl">
      <Link
        href={`/layout/products/${product.id}`}
        className="relative block h-[250px] w-full overflow-hidden bg-muted"
      >
        <Image
          src={image}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <CardContent className="space-y-3 p-4">
        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
          {product.category}
        </span>
        <h2 className="line-clamp-2 text-lg font-semibold text-foreground">
          {product.title}
        </h2>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {product.description}
        </p>
        {rating != null && (
          <div className="flex items-center gap-2 text-sm">
            <span aria-hidden="true">⭐</span>
            <span className="font-medium text-foreground">{rating}</span>
            {product.rating?.count != null && (
              <span className="text-muted-foreground">
                ({product.rating.count} reviews)
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <h3 className="text-2xl font-bold text-foreground">${product.price}</h3>
        <Button className="rounded-xl">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
