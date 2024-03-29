import React, { Dispatch, SetStateAction, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import ingredientPage from "../ingredients";

const DynamicIngs = ({
  category: category,
  ingredient: ingredientEntry,
  setIngredientEntry: updateIng,
}: {
  category: string;
  ingredient: string;
  setIngredientEntry: Dispatch<SetStateAction<string>>;
}) => {
  const { data, isLoading } = trpc.useQuery([
    "ingredient.getAllByCat",
    { category: category },
  ]);

  useEffect(() => {
    if (data && data[0]) {
      updateIng(data[0].id);
    }
  }, [data, updateIng]);

  return (
    <>
      <select
        onChange={(e) => {
          updateIng(e.target.value);
        }}
        // value={ingredientEntry}
        placeholder="ingredient"
      >
        {data && (
          <>
            {data.map((a, key) => {
              return (
                <React.Fragment key={key}>
                  <option value={a.id}>{a.name}</option>
                </React.Fragment>
              );
            })}
          </>
        )}
      </select>
    </>
  );
};

export default DynamicIngs;
