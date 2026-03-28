import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import authApi from "../api/authApi";

const emptyAddressForm = {
  country: "",
  region: "",
  city: "",
  street: "",
  postal_code: "",
  is_default: false,
};

function ProfilePage() {
  const { user, updateProfile, refreshUser, getApiErrorMessage } = useAuth();
  const [saving, setSaving] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
  });

  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return user?.avatar || user?.profile?.avatar || "";
  }, [avatarFile, user]);

  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarFile, avatarPreviewUrl]);

  const loadAddresses = useCallback(async () => {
    if (!user) {
      return;
    }

    setAddressLoading(true);
    try {
      const data = await authApi.getMyAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load addresses"));
    } finally {
      setAddressLoading(false);
    }
  }, [user, getApiErrorMessage]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || user.profile?.phone_number || "",
      bio: user.bio || user.profile?.bio || "",
    });
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const resetAddressForm = () => {
    setAddressForm(emptyAddressForm);
    setEditingAddressId(null);
  };

  const startAddressEdit = (address) => {
    setAddressForm({
      country: address.country || "",
      region: address.region || "",
      city: address.city || "",
      street: address.street || "",
      postal_code: address.postal_code || "",
      is_default: Boolean(address.is_default),
    });
    setEditingAddressId(address.id);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("username", form.username);
      payload.append("email", form.email);
      payload.append("first_name", form.first_name);
      payload.append("last_name", form.last_name);
      payload.append("phone_number", form.phone_number);
      payload.append("bio", form.bio);

      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }

      await updateProfile(payload);
      await refreshUser();
      setAvatarFile(null);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setAddressLoading(true);

    try {
      if (editingAddressId) {
        await authApi.updateMyAddress(editingAddressId, addressForm);
        toast.success("Address updated");
      } else {
        await authApi.createMyAddress(addressForm);
        toast.success("Address added");
      }

      resetAddressForm();
      await loadAddresses();
      await refreshUser();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save address"));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setAddressLoading(true);
    try {
      await authApi.setDefaultMyAddress(addressId);
      await loadAddresses();
      await refreshUser();
      toast.success("Default address updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update default address"));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setAddressLoading(true);
    try {
      await authApi.deleteMyAddress(addressId);
      await loadAddresses();
      await refreshUser();
      if (editingAddressId === addressId) {
        resetAddressForm();
      }
      toast.success("Address removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove address"));
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Update your account details and profile information.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
              {avatarPreviewUrl ? (
                <img src={avatarPreviewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No avatar</div>
              )}
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
          </div>

          <input
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <input
            placeholder="First name"
            value={form.first_name}
            onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            placeholder="Last name"
            value={form.last_name}
            onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            placeholder="Phone number"
            value={form.phone_number}
            onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            rows={3}
          />

          <button
            disabled={saving}
            className="md:col-span-2 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">My Addresses</h2>
        <form onSubmit={handleAddressSubmit} className="mt-4 grid grid-cols-1 gap-3">
          <input
            placeholder="Country"
            value={addressForm.country}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, country: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Region"
              value={addressForm.region}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, region: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              required
            />
            <input
              placeholder="City"
              value={addressForm.city}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              required
            />
          </div>
          <input
            placeholder="Street"
            value={addressForm.street}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, street: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <input
            placeholder="Postal code"
            value={addressForm.postal_code}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, postal_code: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={addressForm.is_default}
              onChange={(event) =>
                setAddressForm((prev) => ({ ...prev, is_default: event.target.checked }))
              }
            />
            Set as default
          </label>

          <div className="flex gap-2">
            <button
              disabled={addressLoading}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
            >
              {addressLoading ? "Saving..." : editingAddressId ? "Update Address" : "Add Address"}
            </button>
            {editingAddressId ? (
              <button
                type="button"
                onClick={resetAddressForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-slate-500">No saved addresses yet.</p>
          ) : (
            addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              >
                <p className="text-sm font-semibold">
                  {address.city}, {address.country}
                  {address.is_default ? " (Default)" : ""}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{address.full_address}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startAddressEdit(address)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                  >
                    Edit
                  </button>
                  {!address.is_default ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                    >
                      Make default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 dark:border-red-900"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
