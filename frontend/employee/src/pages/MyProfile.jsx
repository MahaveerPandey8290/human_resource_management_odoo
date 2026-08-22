import React, { useState } from "react";

const MyProfile = () => {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="profile-page">

      <div className="page-title-row">

        <div>
          <h2>My Profile</h2>
          <p>View and manage your personal employee information.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowEdit(true)}
        >
          ✎ Edit Profile
        </button>

      </div>


      {/* Profile Header */}

      <div className="profile-header-card">

        <div className="large-avatar">
          T
        </div>

        <div className="profile-main-info">
          <h2>Tanu Rajpurohit</h2>
          <p>Software Developer</p>
          <span>Employee ID: EMP-1024</span>
        </div>

        <div className="profile-status">
          <span className="status-dot"></span>
          Active
        </div>

      </div>


      {/* Personal Details */}

      <div className="profile-grid">

        <section className="profile-card">

          <div className="card-heading">
            <div>
              <h3>Personal Details</h3>
              <p>Your personal information</p>
            </div>

            <span>👤</span>
          </div>

          <div className="details-grid">

            <div className="detail-item">
              <span>Full Name</span>
              <strong>Tanu Rajpurohit</strong>
            </div>

            <div className="detail-item">
              <span>Email</span>
              <strong>tanu@example.com</strong>
            </div>

            <div className="detail-item">
              <span>Phone</span>
              <strong>+91 98765 43210</strong>
            </div>

            <div className="detail-item">
              <span>Date of Birth</span>
              <strong>15 March 2004</strong>
            </div>

            <div className="detail-item">
              <span>Gender</span>
              <strong>Female</strong>
            </div>

            <div className="detail-item">
              <span>Address</span>
              <strong>Rajasthan, India</strong>
            </div>

          </div>

        </section>


        {/* Job Details */}

        <section className="profile-card">

          <div className="card-heading">

            <div>
              <h3>Job Details</h3>
              <p>Your employment information</p>
            </div>

            <span>💼</span>

          </div>

          <div className="details-grid">

            <div className="detail-item">
              <span>Employee ID</span>
              <strong>EMP-1024</strong>
            </div>

            <div className="detail-item">
              <span>Department</span>
              <strong>Technology</strong>
            </div>

            <div className="detail-item">
              <span>Designation</span>
              <strong>Software Developer</strong>
            </div>

            <div className="detail-item">
              <span>Joining Date</span>
              <strong>10 July 2024</strong>
            </div>

            <div className="detail-item">
              <span>Employment Type</span>
              <strong>Full Time</strong>
            </div>

            <div className="detail-item">
              <span>Work Location</span>
              <strong>Head Office</strong>
            </div>

          </div>

        </section>


        {/* Salary */}

        <section className="profile-card">

          <div className="card-heading">

            <div>
              <h3>Salary Information</h3>
              <p>Your salary details</p>
            </div>

            <span>₹</span>

          </div>

          <div className="salary-box">
            <span>Monthly Salary</span>
            <strong>₹45,000</strong>
          </div>

          <div className="salary-row">
            <span>Basic Salary</span>
            <strong>₹30,000</strong>
          </div>

          <div className="salary-row">
            <span>Allowances</span>
            <strong>₹10,000</strong>
          </div>

          <div className="salary-row">
            <span>Other Benefits</span>
            <strong>₹5,000</strong>
          </div>

        </section>


        {/* Documents */}

        <section className="profile-card">

          <div className="card-heading">

            <div>
              <h3>Documents</h3>
              <p>Your uploaded documents</p>
            </div>

            <span>📄</span>

          </div>

          <div className="document-item">
            <span>📄</span>
            <div>
              <strong>Aadhar Card</strong>
              <small>Verified document</small>
            </div>
            <button>View</button>
          </div>

          <div className="document-item">
            <span>📄</span>
            <div>
              <strong>Employment Contract</strong>
              <small>PDF Document</small>
            </div>
            <button>View</button>
          </div>

          <div className="document-item">
            <span>📄</span>
            <div>
              <strong>Salary Certificate</strong>
              <small>PDF Document</small>
            </div>
            <button>View</button>
          </div>

        </section>

      </div>


      {/* Edit Profile Modal */}

      {showEdit && (

        <div
          className="modal-overlay"
          onClick={() => setShowEdit(false)}
        >

          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <h2>Edit Profile</h2>
                <p>Update your personal information.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowEdit(false)}
              >
                ×
              </button>

            </div>


            <div className="form-grid">

              <div className="form-group">
                <label>Full Name</label>
                <input defaultValue="Tanu Rajpurohit" />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input defaultValue="tanu@example.com" />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input defaultValue="+91 98765 43210" />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" defaultValue="2004-03-15" />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea defaultValue="Rajasthan, India"></textarea>
              </div>

            </div>


            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() => setShowEdit(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={() => setShowEdit(false)}
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default MyProfile;