import { useState } from "react";

const initialState = {
  name: "",
  product_image: "",
  product_image_file: null,
  description: "",
  price: "",
  stock: "",
  category_id: "",
};

const mapProductToForm = (product) => {
  if (!product) {
    return initialState;
  }

  return {
    name: product.name || "",
    product_image: product.product_image || "",
    product_image_file: null,
    description: product.description || "",
    price: product.price || "",
    stock: product.stock || "",
    category_id: product.category?.id || "",
  };
};

function ProductForm({ product, categories, onSubmit, loading }) {
  const [form, setForm] = useState(() => mapProductToForm(product));
  const [imageMode, setImageMode] = useState("url");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();

    if (imageMode === "upload" && form.product_image_file) {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("category_id", String(Number(form.category_id)));
      payload.append("price", String(Number(form.price)));
      payload.append("stock", String(Number(form.stock)));
      payload.append("description", form.description || "");
      payload.append("product_image", "");
      payload.append("product_image_file", form.product_image_file);
      onSubmit(payload);
      return;
    }

    onSubmit({
      ...form,
      product_image_file: null,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: Number(form.category_id),
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input
        placeholder="Product name"
        value={form.name}
        onChange={(event) => handleChange("name", event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        required
      />
      <select
        value={form.category_id}
        onChange={(event) => handleChange("category_id", event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        required
      >
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={form.price}
        onChange={(event) => handleChange("price", event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        required
      />
      <div className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Image Source
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="imageMode"
              checked={imageMode === "url"}
              onChange={() => setImageMode("url")}
            />
            URL
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="imageMode"
              checked={imageMode === "upload"}
              onChange={() => setImageMode("upload")}
            />
            Upload
          </label>
        </div>
      </div>
      {imageMode === "url" ? (
        <input
          type="url"
          placeholder="Product image URL"
          value={form.product_image}
          onChange={(event) => handleChange("product_image", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={(event) =>
            handleChange("product_image_file", event.target.files?.[0] || null)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
      )}
      <input
        type="number"
        placeholder="Stock"
        value={form.stock}
        onChange={(event) => handleChange("stock", event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        required
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(event) => handleChange("description", event.target.value)}
        className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        rows={4}
      />
      <button
        disabled={loading}
        className="md:col-span-2 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {loading ? "Saving..." : product ? "Update product" : "Create product"}
      </button>
    </form>
  );
}

export default ProductForm;
