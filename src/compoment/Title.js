import PropTypes from 'prop-types';
import React from 'react';

export default function Title({ name, title, color = "text-blue", size = "h1", style = {} }) {
  const HeadingTag = size; // Dynamically render h1, h2, etc.

  return (
    <div className="row">
      <div className="col-10 mx-auto my-2 text-center text-title">
        <HeadingTag
          className={`text-capitalize font-weight-bold ${color}`}
          style={style}
        >
          {name} <strong>{title}</strong>
        </HeadingTag>
      </div>
    </div>
  );
}

Title.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string, // Accept a custom color class
  size: PropTypes.string, // h1, h2, h3, etc.
  style: PropTypes.object, // Inline styles
};
