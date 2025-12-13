import { useSnackbar, VariantType } from 'notistack'

export function useNotification() {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()

    const notify = (message: string, variant: VariantType = 'default') => {
        enqueueSnackbar(message, { 
            variant,
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
    }

    return {
        success: (message: string) => notify(message, 'success'),
        error: (message: string) => notify(message, 'error'),
        warning: (message: string) => notify(message, 'warning'),
        info: (message: string) => notify(message, 'info'),
        notify,
        close: closeSnackbar
    }
}
