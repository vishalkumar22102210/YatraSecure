import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: tripId, photoId } = await params;
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/photos/${photoId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error toggling photo like:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
