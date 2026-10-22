'use strict';

(() => {
    const form = document.getElementById('application-form');
    const review = document.getElementById('application-review');
    const reviewDetails = document.getElementById('review-details');
    const formError = document.getElementById('form-error');
    const resume = document.getElementById('resume');
    const position = document.getElementById('position');
    const gender = document.getElementById('gender');
    const genderDescription = document.getElementById('gender-description');
    const requiredFields = [...form.querySelectorAll('[required]')];
    let attemptedReview = false;

    const requestedPosition = new URLSearchParams(window.location.search).get('position');
    if ([...position.options].some(option => option.value === requestedPosition)) {
        position.value = requestedPosition;
    }

    function validate(field) {
        field.setCustomValidity('');
        if (field.type === 'file') {
            const file = field.files[0];
            if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) {
                field.setCustomValidity('Choose a PDF, DOC, or DOCX file.');
            } else if (file && file.size === 0) {
                field.setCustomValidity('This file is empty. Choose a file with content.');
            } else if (file && file.size > 5 * 1024 * 1024) {
                field.setCustomValidity('Choose a file smaller than or equal to 5 MB.');
            }
        } else if (field.value && !field.value.trim()) {
            field.setCustomValidity('Enter a value, not just spaces.');
        } else if (field.id === 'phone' && field.value.trim()) {
            const number = field.value.trim();
            const digits = number.replace(/\D/g, '');
            if (!/^\+?[\d\s().-]+$/.test(number) || digits.length < 7 || digits.length > 15) {
                field.setCustomValidity('Enter a phone number with 7 to 15 digits. You can include a country code, spaces, hyphens, or parentheses.');
            }
        }
        const valid = field.validity.valid;
        const error = document.getElementById(field.id + '-error');
        field.setAttribute('aria-invalid', String(!valid));
        if (error) {
            error.textContent = valid ? '' : field.validationMessage;
            error.hidden = valid;
        }
        return valid;
    }

    for (const field of requiredFields) {
        field.addEventListener('blur', () => {
            if (field.value || attemptedReview) validate(field);
        });
        field.addEventListener('input', () => {
            if (attemptedReview || field.getAttribute('aria-invalid') === 'true') validate(field);
        });
        field.addEventListener('change', () => {
            if (attemptedReview || field.type === 'file' || field.getAttribute('aria-invalid') === 'true') validate(field);
        });
    }

    resume.addEventListener('change', () => {
        const file = resume.files[0];
        document.getElementById('resume-selection').textContent = file
            ? file.name + ' (' + (file.size / (1024 * 1024)).toFixed(2) + ' MB)'
            : '';
    });

    gender.addEventListener('change', () => {
        const describe = gender.value === 'self-described';
        document.getElementById('gender-description-field').hidden = !describe;
        genderDescription.disabled = !describe;
    });

    function addReviewRow(label, value) {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4';
        const term = document.createElement('dt');
        term.className = 'font-semibold';
        term.textContent = label;
        const description = document.createElement('dd');
        description.className = 'sm:col-span-2 min-w-0 break-words whitespace-pre-wrap leading-relaxed';
        description.textContent = value;
        row.append(term, description);
        reviewDetails.append(row);
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        attemptedReview = true;
        for (const input of form.querySelectorAll('input:not([type="file"]), textarea')) {
            input.value = input.value.trim();
        }
        const invalid = requiredFields.filter(field => !validate(field));
        if (invalid.length) {
            formError.hidden = false;
            formError.textContent = 'Please correct the highlighted fields before reviewing your application.';
            invalid[0].focus();
            return;
        }

        formError.hidden = true;
        reviewDetails.replaceChildren();
        const values = new FormData(form);
        const genderValue = gender.value === 'self-described'
            ? (genderDescription.value.trim() || 'Self-described')
            : gender.selectedOptions[0].textContent;
        [
            ['First name', values.get('firstName')],
            ['Last name', values.get('lastName')],
            ['Email address', values.get('email')],
            ['Phone number', values.get('phone')],
            ['Gender', genderValue],
            ['Full address', values.get('address')],
            ['Country', values.get('country')],
            ['Postal code', values.get('postalCode') || 'Not provided'],
            ['Position', position.selectedOptions[0].textContent],
            ['Resume / CV', resume.files[0].name],
        ].forEach(([label, value]) => addReviewRow(label, value));
        form.hidden = true;
        review.hidden = false;
        document.getElementById('review-heading').focus();
    });

    document.getElementById('edit-application').addEventListener('click', () => {
        review.hidden = true;
        form.hidden = false;
        document.getElementById('first-name').focus();
    });

    // This static page previews FormData only; no request or persistent storage is used.
    form.noValidate = true;
    document.getElementById('review-button').disabled = false;
})();
