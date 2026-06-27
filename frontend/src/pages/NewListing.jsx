import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function NewListing() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ title: "", description: "", image: "", price: "", country: "", location: "" });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/listings", { ...form, price: parseInt(form.price) });
      toast.show("Listing created!", "success");
      navigate(`/listings/${data.listing._id}`);
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
  };

  return (
    <div className="col-md-8 offset-md-2">
      <h2 className="mt-3">Add a New Listing</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3"><label className="form-label">Title</label><input className="form-control" value={form.title} onChange={update("title")} required /></div>
        <div className="mb-3"><label className="form-label">Description</label><textarea className="form-control" rows="3" value={form.description} onChange={update("description")} required /></div>
        <div className="mb-3"><label className="form-label">Image URL</label><input className="form-control" value={form.image} onChange={update("image")} placeholder="https://..." /></div>
        <div className="row">
          <div className="col-md-6 mb-3"><label className="form-label">Price (₹/night)</label><input type="number" className="form-control" value={form.price} onChange={update("price")} required /></div>
          <div className="col-md-6 mb-3"><label className="form-label">Country</label><input className="form-control" value={form.country} onChange={update("country")} required /></div>
        </div>
        <div className="mb-3"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={update("location")} required /></div>
        <button className="btn btn-danger">Add Listing</button>
      </form>
    </div>
  );
}
