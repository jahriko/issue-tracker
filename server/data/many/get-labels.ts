import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const getLabels = async () => {
  const labels = await prisma.label.findMany({
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return labels;
};

export type LabelsData = Prisma.PromiseReturnType<typeof getLabels>;
