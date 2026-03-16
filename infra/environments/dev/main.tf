module "certs" {
  source = "../modules/certs"
}

module "auth" {
  source             = "../modules/auth"
  validated_cert_arn = module.certs.validated_cert_arn
}


