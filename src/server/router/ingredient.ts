import { createRouter } from "./context";
import { date, z } from "zod";
import { Prisma } from "@prisma/client";

export const ingredientRouter = createRouter()
  .query("hello", {
    input: z.object({
      text: z.string(),
    }),
    resolve({ input }) {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    },
  })
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.ingredient.findMany();
    },
  })
  .mutation("createIngredient", {
    //create ingredient call{allIngredients.data}
    input: z.object({
      name: z.string(),
      quanity: z.number(),
      canBeUsedUp: z.boolean(),
      category: z.string(),
    }),
    async resolve({ input }) {
      const { name, quanity, canBeUsedUp, category } = input;
      let date = new Date();
      name.toLowerCase();
      const catId = await prisma?.category.findFirstOrThrow({
        where: { name: category },
      });

      const existing = await prisma?.ingredient.findFirst({
        where: { name: name },
      });

      if (existing === null || existing?.quantity === undefined) {
        return 0;
      }

      try {
        await prisma?.category.update({
          where: { id: catId?.id },
          data: {
            Ingredient: {
              update: {
                where: { id: existing?.id },
                data: {
                  quantity: quanity + existing?.quantity, //updates quantity and day
                  dayAcquired: date,
                },
              },
            },
          },
        });
      } catch {}

      return 1;
    },
  })
  .query("getSortedIng", {
    async resolve({ ctx }) {
      return await ctx.prisma.ingredient.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: { categoryId: "asc" },
        select: {
          name: true,
          quantity: true,
          dayAcquired: true,
          id: true,
          category: { select: { name: true, daysGoodFor: true } },
        },
      });
    },
  })
  .query("getIngByDate", {
    async resolve({ ctx }) {
      return await ctx.prisma.ingredient.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: { dayAcquired: "asc" },
        select: {
          name: true,
          quantity: true,
          dayAcquired: true,
          category: { select: { name: true, daysGoodFor: true } },
        },
      });
    },
  })
  .query("getMissingAmount", {
    input: z.object({
      recipeId: z.string().nullish(),
      ingredientId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const recipeId = input.recipeId;
      const ingredientId = input?.ingredientId;
      const missingAm = await ctx.prisma.ingredientUsed.findFirstOrThrow({
        where: { recipeId: recipeId, ingredientId: ingredientId },
      });
      return missingAm.amountUsed;
    },
  })
  .mutation("reduceIng", {
    input: z.object({
      ingredientId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const ingId = input?.ingredientId;
      const ing = await ctx.prisma.ingredient.findFirstOrThrow({
        where: { id: ingId },
      });
      if (ing.quantity >= 1) {
        const change = await ctx.prisma.ingredient.update({
          where: { id: ingId },
          data: { quantity: ing.quantity - 1 },
        });
      }
    },
  })
  .mutation("increaseIng", {
    input: z.object({
      ingredientId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const ingId = input?.ingredientId;
      const ing = await ctx.prisma.ingredient.findFirstOrThrow({
        where: { id: ingId },
      });
      const change = await ctx.prisma.ingredient.update({
        where: { id: ingId },
        data: { quantity: ing.quantity + 1 },
      });
    },
  })
  .mutation("useIngRecipe", {
    input: z.object({
      ingredientId: z.string(),
      amountUsed: z.number().nullish(),
    }),
    async resolve({ input, ctx }) {
      const ingId = input?.ingredientId;
      const ingUse = input?.amountUsed;
      const ing = await ctx.prisma.ingredient.findFirstOrThrow({
        where: { id: ingId },
      });
      const change = await ctx.prisma.ingredient.update({
        where: { id: ingId },
        data: { quantity: Math.max(0, ing.quantity - (ingUse ?? 0)) },
      });
    },
  })
  .query("getAllByCat", {
    input: z.object({
      category: z.string(),
    }),
    async resolve({ ctx, input }) {
      const cat = input?.category;
      return await ctx.prisma.ingredient.findMany({
        where: { category: { name: cat } },
        select: { name: true, id: true },
      });
    },
  })
  .query("getAllCategories", {
    async resolve({ ctx }) {
      return await ctx.prisma.category.findMany({
        select: { name: true },
      });
    },
  })
  .query("getIdByName", {
    input: z
      .object({
        name: z.string().nullish(),
      })
      .nullish(),
    async resolve({ ctx, input }) {
      return await ctx.prisma.ingredient.findFirstOrThrow({
        where: { name: input?.name ?? "" },
      });
    },
  });
