'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';

export type ReviewState = { error?: string; success?: string } | undefined;

export async function addProductReview(productId: string, _prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const userId = await getUserId();
  if (!userId) return { error: 'Oturum açmalısın.' };

  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') ?? '').trim();

  if (!rating || rating < 1 || rating > 5) {
    return { error: 'Lütfen 1 ile 5 arasında bir yıldız puanı seç.' };
  }
  if (comment.length > 500) {
    return { error: 'Yorum en fazla 500 karakter olabilir.' };
  }

  // Kullanıcının bu ürünü teslim alıp almadığını kontrol et
  const deliveredItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      fulfillment: 'DELIVERED',
      order: { userId },
    },
  });

  if (!deliveredItem) {
    return { error: 'Bu ürüne yorum yapabilmek için önce ürünü teslim almış olman gerekiyor.' };
  }

  try {
    await prisma.review.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        userId,
        productId,
        rating,
        comment: comment || null,
      },
    });
  } catch (e) {
    return { error: 'Yorum kaydedilirken bir hata oluştu.' };
  }

  revalidatePath(`/urun/${productId}`);
  return { success: 'Değerlendirmen başarıyla kaydedildi!' };
}
