from rest_framework.authentication import BaseAuthentication
from clerk_backend_api import authenticate_request, AuthenticateRequestOptions, Clerk
from .models import User
from django.conf import settings


class JWTAuthentication(BaseAuthentication):
    def authenticate (self, request):
        if "Authorization" not in request.headers:
            return None
        auth = request.headers.get("Authorization")

        if "Bearer" not in auth:
            return None
        token = auth.split(" ")[1]

        try:
            request_state = authenticate_request(
                request,
                AuthenticateRequestOptions(
                    secret_key=settings.CLERK_API_SECRET_KEY,
                    clock_skew_in_ms=5000
                )
            )
            if not request_state.is_signed_in:
                print("Auth failed", request_state.message)
                return None
            
            with Clerk(bearer_auth=settings.CLERK_API_SECRET_KEY) as clerk:
                user_data = clerk.users.get(user_id = request_state.payload["sub"])
                primary_email_id = user_data.primary_email_address_id
                username = user_data.username
                email = next(
                    (email for email in user_data.email_addresses if email.id == primary_email_id),
                    None
                )
            user, _ = User.objects.get_or_create(
                id = request_state.payload["sub"],
                defaults={"email": email.email_address, "username": username, "Plan": User.Plans.BASIC}
            )
            return(user, token)
        except Exception as e:
            print(e)
            return None


