'use client';

import React from 'react';

/**
 * Rute workspace milik talenta (pengerjaan enrollment).
 *
 * Layout ini sebelumnya memasang layar "Menunggu Persetujuan Admin" untuk
 * perusahaan yang belum terverifikasi — gerbang yang benar isinya tapi salah
 * tempatnya, karena perusahaan tidak pernah membuka rute ini. Penjelasan itu
 * kini hidup di `CompanyAccessGate` dan dipasang di rute yang benar-benar
 * dilewati perusahaan.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
