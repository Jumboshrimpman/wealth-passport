const CONTACT_HREF = `mailto:Aptally.app@gmail.com?subject=${encodeURIComponent("WealthPass")}&body=${encodeURIComponent("Hello,\n\nI have a question about WealthPass.\n")}`;

export function LegalFooter() {
  return (
    <footer className="legal-footer">
      <p>
        WealthPass is a marketplace where clients get financial offers matched to their household.
        Offers are not advice, a solicitation, or a commitment to lend or invest. Enroll uses
        simulated connections only. Nothing is sent to a bank, a custodian, or a government agency.
        The ranking is proprietary and cannot be bought.
      </p>
      <a href={CONTACT_HREF}>Contact us</a>
    </footer>
  );
}
