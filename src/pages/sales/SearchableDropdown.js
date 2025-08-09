import React, { useState, useRef, useEffect } from 'react';
import { Form, Dropdown, InputGroup } from "@themesberg/react-bootstrap";

const SearchableDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Search...",
  label,
  icon,
  allOptionText = "All Options"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value) return allOptionText;
    const selectedOption = options.find(opt => opt.id === value);
    return selectedOption ? selectedOption.name : allOptionText;
  };

  // Filter options based on search term
  useEffect(() => {
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  };

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <Form.Group>
      {label && (
        <Form.Label className="fw-semibold">
          {icon && <i className={`${icon} me-1`}></i>}
          {label}
        </Form.Label>
      )}
      <div className="position-relative" ref={dropdownRef}>
        <Dropdown show={isOpen} onToggle={handleToggle}>
          <Dropdown.Toggle
            as="div"
            className="form-select d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={handleToggle}
          >
            <span>{getDisplayText()}</span>
            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </Dropdown.Toggle>

          <Dropdown.Menu className="w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {/* Search Input */}
            <div className="px-3 py-2">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>
            </div>

            <Dropdown.Divider />

            {/* All Options Item */}
            <Dropdown.Item
              active={!value}
              onClick={() => handleOptionSelect('')}
            >
              {allOptionText}
            </Dropdown.Item>

            {/* Filtered Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Dropdown.Item
                  key={option.id}
                  active={value === option.id}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {option.name}
                </Dropdown.Item>
              ))
            ) : searchTerm ? (
              <Dropdown.Item disabled>
                <em>No results found</em>
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Form.Group>
  );
};
export default SearchableDropdown;
