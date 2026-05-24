import Swal from 'sweetalert2'

export const appSwal = Swal.mixin({
  allowOutsideClick: false,
  buttonsStyling: false,
  customClass: {
    popup: 'app-swal-popup',
    title: 'app-swal-title',
    htmlContainer: 'app-swal-content',
    confirmButton: 'btn btn-gold',
    cancelButton: 'btn btn-outline',
    input: 'app-swal-input',
    validationMessage: 'app-swal-validation',
  },
})
