import React, { useState, useEffect } from 'react';
import './EmployeeProfileView.css';

const EmployeeProfileView = ({ employee, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...employee });

  // Update local state if the selected employee changes
  useEffect(() => {
    setFormData({ ...employee });
  }, [employee]);

  const handleChange = (e, field, subfield = null) => {
    if (subfield) {
      setFormData({
        ...formData,
        [field]: {
          ...formData[field],
          [subfield]: e.target.value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: e.target.value
      });
    }
  };

  const handleArrayChange = (e, field) => {
    const arr = e.target.value.split(',').map(item => item.trim());
    setFormData({
      ...formData,
      [field]: arr
    });
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Here you would typically save the data to a backend or state manager
      console.log('Saved data:', formData);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="profile-view-container">
      <div className="profile-header-actions">
        <button className="back-btn" onClick={onBack}>
          ← Back to Employees
        </button>
        <button 
          className="edit-profile-btn" 
          onClick={toggleEdit}
        >
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-layout">
        {/* Left Column: Basic Info */}
        <div className="profile-left">
          <div className="profile-basic-card">
            <div className="profile-avatar-large">
              {formData.name ? formData.name.charAt(0) : '?'}
            </div>
            
            {isEditing ? (
              <div className="edit-group">
                <input type="text" className="edit-input" value={formData.name} onChange={(e) => handleChange(e, 'name')} placeholder="Name" />
                <input type="text" className="edit-input" value={formData.title} onChange={(e) => handleChange(e, 'title')} placeholder="Title" />
                <input type="text" className="edit-input" value={formData.department} onChange={(e) => handleChange(e, 'department')} placeholder="Department" />
              </div>
            ) : (
              <>
                <h2>{formData.name}</h2>
                <p className="profile-title">{formData.title}</p>
                <p className="profile-dept">{formData.department}</p>
              </>
            )}
            
            <div className="profile-contact-info">
              <div className="info-row">
                <span className="label">Login ID</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.id} onChange={(e) => handleChange(e, 'id')} /> 
                  : <span className="value">{formData.id}</span>
                }
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.email} onChange={(e) => handleChange(e, 'email')} /> 
                  : <span className="value">{formData.email}</span>
                }
              </div>
              <div className="info-row">
                <span className="label">Mobile</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.mobile} onChange={(e) => handleChange(e, 'mobile')} /> 
                  : <span className="value">{formData.mobile}</span>
                }
              </div>
              <div className="info-row">
                <span className="label">Company</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.company} onChange={(e) => handleChange(e, 'company')} /> 
                  : <span className="value">{formData.company}</span>
                }
              </div>
              <div className="info-row">
                <span className="label">Manager</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.manager} onChange={(e) => handleChange(e, 'manager')} /> 
                  : <span className="value">{formData.manager}</span>
                }
              </div>
              <div className="info-row">
                <span className="label">Location</span>
                {isEditing ? 
                  <input type="text" className="edit-input-small value" value={formData.location} onChange={(e) => handleChange(e, 'location')} /> 
                  : <span className="value">{formData.location}</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info Tabs/Sections */}
        <div className="profile-right">
          <div className="detail-section">
            <h3>About</h3>
            {isEditing ? 
              <textarea className="edit-textarea" value={formData.about} onChange={(e) => handleChange(e, 'about')} rows="3" /> 
              : <p>{formData.about}</p>
            }
          </div>

          <div className="detail-section">
            <h3>What I love about my job</h3>
            {isEditing ? 
              <textarea className="edit-textarea" value={formData.whatILove} onChange={(e) => handleChange(e, 'whatILove')} rows="2" /> 
              : <p>{formData.whatILove}</p>
            }
          </div>

          <div className="grid-sections">
            <div className="detail-section">
              <h3>Private Info</h3>
              <p><strong>DOB:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.privateInfo.dob} onChange={(e) => handleChange(e, 'privateInfo', 'dob')} /> : formData.privateInfo.dob}</p>
              <p><strong>Marital Status:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.privateInfo.maritalStatus} onChange={(e) => handleChange(e, 'privateInfo', 'maritalStatus')} /> : formData.privateInfo.maritalStatus}</p>
              <p><strong>Emergency:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.privateInfo.emergencyContact} onChange={(e) => handleChange(e, 'privateInfo', 'emergencyContact')} /> : formData.privateInfo.emergencyContact}</p>
            </div>

            <div className="detail-section">
              <h3>Salary Info</h3>
              <p><strong>Base:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.salaryInfo.baseSalary} onChange={(e) => handleChange(e, 'salaryInfo', 'baseSalary')} /> : formData.salaryInfo.baseSalary}</p>
              <p><strong>Bonus:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.salaryInfo.bonus} onChange={(e) => handleChange(e, 'salaryInfo', 'bonus')} /> : formData.salaryInfo.bonus}</p>
              <p><strong>Bank:</strong> {isEditing ? <input type="text" className="edit-input-small" value={formData.salaryInfo.bankAccount} onChange={(e) => handleChange(e, 'salaryInfo', 'bankAccount')} /> : formData.salaryInfo.bankAccount}</p>
            </div>
          </div>

          <div className="grid-sections">
            <div className="detail-section tags-section">
              <h3>Skills</h3>
              {isEditing ? (
                <input type="text" className="edit-input" value={formData.skills.join(', ')} onChange={(e) => handleArrayChange(e, 'skills')} placeholder="Comma separated skills" />
              ) : (
                <div className="tags">
                  {formData.skills.map((skill, idx) => (
                    <span key={idx} className="tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section tags-section">
              <h3>Interests</h3>
              {isEditing ? (
                <input type="text" className="edit-input" value={formData.interests.join(', ')} onChange={(e) => handleArrayChange(e, 'interests')} placeholder="Comma separated interests" />
              ) : (
                <div className="tags">
                  {formData.interests.map((interest, idx) => (
                    <span key={idx} className="tag">{interest}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Certifications</h3>
            {isEditing ? (
              <input type="text" className="edit-input" value={formData.certifications.join(', ')} onChange={(e) => handleArrayChange(e, 'certifications')} placeholder="Comma separated certifications" />
            ) : (
              formData.certifications.length > 0 ? (
                <ul className="cert-list">
                  {formData.certifications.map((cert, idx) => (
                    <li key={idx}>{cert}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No certifications listed.</p>
              )
            )}
          </div>
          
          <div className="detail-section">
            <h3>Resume</h3>
            <div className="resume-attachment">
              <span className="icon">📄</span>
              {isEditing ? (
                <input type="text" className="edit-input" value={formData.resume} onChange={(e) => handleChange(e, 'resume')} />
              ) : (
                <span className="filename">{formData.resume}</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileView;
