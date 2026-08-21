import Link from 'next/link';
import Card from '@/components/ui/Card';

interface PhotographerCardProps {
  id: string;
  fullName: string;
  city: string;
  categories: string[];
  priceRange: string;
  rating: number;
}

export default function PhotographerCard({
  id,
  fullName,
  city,
  categories,
  priceRange,
  rating,
}: PhotographerCardProps) {
  return (
    <Link href={`/photographers/${id}`}>
      <Card className="transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-sm text-brand-600">
            ★ {rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">{city}</p>
        <p className="mt-2 text-sm text-gray-600">{categories.join(', ')}</p>
        <p className="mt-2 text-sm font-medium text-gray-800">{priceRange}</p>
      </Card>
    </Link>
  );
}
