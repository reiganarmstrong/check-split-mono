# automate loading cloudflare api token from bitwarden

# check if the vault is unlocked
if [ -z "$BW_SESSION" ]; then
  echo "Error: Bitwarden vault is locked. Run 'export BW_SESSION=\$(bw unlock --raw)' first."
  exit 1
fi

# fetch the token from Bitwarden
echo "Fetching Cloudflare token from Bitwarden..."
export CLOUDFLARE_API_TOKEN=$(bw get item "Cloudflare Terraform Token" | jq -r '.fields[] | select(.name == "API_KEY") | .value')