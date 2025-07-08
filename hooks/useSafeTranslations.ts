import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

// 定义回退翻译
const getFallbackTranslations = (namespace: string) => {
    const fallbackTranslations: Record<string, Record<string, string>> = {
        'pages.login': {
            'title': 'User Login',
            'heading': 'Sign in to your account',
            'description': 'Choose your login method',
            'instructions': 'Login using one of the following methods to continue using AI Color Assistant',
            'email': 'Email',
            'password': 'Password',
            'devPassword': 'Password (any value in dev mode)',
            'emailPlaceholder': 'your.email@example.com',
            'passwordPlaceholder': '••••••••',
            'emailRequired': 'Please enter your email',
            'loginFailed': 'Login failed, please try again',
            'loggingIn': 'Logging in...',
            'emailLogin': 'Sign in with Email',
            'orSocialLogin': 'Or sign in with social account',
            'googleLogin': 'Sign in with Google',
            'facebookLogin': 'Sign in with Facebook',
            'twitterLogin': 'Sign in with X',
            'loginButton': 'Sign In',
            'loginError': 'Login failed, please check your credentials',
            'terms': 'By logging in, you agree to our Terms of Service and Privacy Policy'
        },
        'pages.billing': {
            'title': 'Billing History'
        },
        'components.exampleColorSchemes': {
            'loading': 'Loading examples...',
            'error': 'Failed to load examples. Please try again later.',
            'tryAnother': 'Try another'
        },
        'components.billing': {
            'remainingCredits': 'Remaining Credits: {credits}',
            'upgradeMember': 'Upgrade Membership',
            'loading': 'Loading...',
            'noRecords': 'No billing records found.',
            'amount': 'Amount',
            'currency': 'Currency',
            'provider': 'Provider',
            'status': 'Status',
            'purchaseType': 'Purchase Type',
            'membershipType': 'Membership Type',
            'creditsPurchased': 'Credits Purchased',
            'createdAt': 'Created At',
            'previous': 'Previous',
            'next': 'Next',
            'pageInfo': 'Page {current} of {total}',
            'title': 'Billing History',
            'date': 'Date',
            'type': 'Type',
            'actions': 'Actions',
            'noData': 'No Data',
            'error': 'Loading Error',
            'page': 'Page {current} of {total}',
            'successful': 'Successful',
            'failed': 'Failed',
            'pending': 'Pending',
            'cancelled': 'Cancelled',
            'viewReceipt': 'View Receipt',
            'download': 'Download'
        }
    };

    return (key: string): string => {
        const namespaceTranslations = fallbackTranslations[namespace];
        if (namespaceTranslations && namespaceTranslations[key]) {
            return namespaceTranslations[key];
        }

        console.warn(`No fallback translation found for: ${namespace}.${key}`);
        return key;
    };
};

// 安全的翻译 hook，用于处理构建时的国际化问题
export function useSafeTranslations(namespace: string) {
    // 总是调用 useTranslations，但处理可能的错误
    let t: any;
    let hasError = false;

    try {
        t = useTranslations(namespace);
    } catch (error) {
        console.warn(`Failed to load translations for namespace: ${namespace}`, error);
        hasError = true;
    }

    const fallbackTranslation = useMemo(
        () => getFallbackTranslations(namespace),
        [namespace]
    );

    // 如果有错误，返回回退翻译；否则返回正常翻译
    return hasError ? fallbackTranslation : t;
}

// 导出类型
export type SafeTranslationFunction = (key: string) => string; 