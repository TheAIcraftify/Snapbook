'use client';

import { useState } from 'react';

type Props = {
  bookingId: string;
  customerId: string;
  photographerId: string;
};

export default function ReviewForm({
  bookingId,
  customerId,
  photographerId,
}: Props) {
