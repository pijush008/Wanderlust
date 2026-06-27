import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => {
      const l = r.data.listing;
      setForm({
        title: l.title,
        description: l.description,
        image: l.image?.url || "",
        price: l.price,
        country: l.country,
        location: l.location,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/listings/${id}`, { ...form, price: parseInt(form.price) });
      toast.show("Listing updated!", "success");
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.show(err.response?.data?.error || "Failed", "error");
    }
  };

  if (loading || !form) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div className="col-md-8 offset-md-2">
      <h2 className="mt-3">Edit Listing</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3"><label className="form-label">Title</label><input className="form-control" value={form.title} onChange={update("title")} required /></div>
        <div className="mb-3"><label className="form-label">Description</label><textarea className="form-control" rows="3" value={form.description} onChange={update("description")} required /></div>
        <div className="mb-3"><label className="form-label">Image URL</label><input className="form-control" value={form.image} onChange={update("image")} /></div>
        <div className="row">
          <div className="col-md-6 mb-3"><label className="form-label">Price</label><input type="number" className="form-control" value={form.price} onChange={update("price")} required /></div>
          <div className="col-md-6 mb-3"><label className="form-label">Country</label><input className="form-control" value={form.country} onChange={update("country")} required /></div>
        </div>
        <div className="mb-3"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={update("location")} required /></div>
        <button className="btn btn-dark">Update Listing</button>
      </form>
    </div>
  );
}
