package RNSP::IndicatorFormula;

use Moose;
use Math::Expression::Evaluator;


has formula => (
    is         => 'rw',
    isa        => 'Str',
    required   => 1
);

has auto_parse => (
    is         => 'ro',
    isa        => 'Bool',
    default    => sub { 1 }
);

has auto_check => (
    is         => 'ro',
    isa        => 'Bool',
    default    => sub { 1 }
);

has schema => (
    is         => 'ro',
    isa        => 'Any',
    required   => 1
);


has _math_ee => (
    is      => 'rw',
    isa     => 'Math::Expression::Evaluator',
    lazy    => 1,
    default => sub { Math::Expression::Evaluator->new }
);

has _compiled => (
    is      => 'rw',
    isa     => 'Any',
);


has _variable => (
    is      => 'rw',
    isa     => 'ArrayRef[Int]',
    lazy    => 1,
    default => sub { [] },
    traits  => [qw(Array)],
    handles => {
        variables         => 'elements',
        _add_variable     => 'push',
        _variable_count   => 'count',
        _get_varaible     => 'get',
        _clear_variables  => 'clear',
    }
);


sub BUILD {
    my ($self) = @_;
    if ($self->auto_parse){ $self->parse }
}

sub parse {
    my ($self) = @_;
    my $formula = $self->formula;

    $self->_clear_variables;
    # caputar todas as variaveis
    $self->_add_variable($1) while ($formula =~ /\:(\d+)\:/go);

    # troca por V<ID>
    $formula =~ s/\:(\d+)\:/V$1/go;

    # TODO tratar strings! strings don't math!


    my $ee = $self->_math_ee;
    $self->_compiled($ee->parse($formula)->compiled);

    $self->check() if $self->auto_check;
}

sub evaluate {
    my ($self, %vars) = @_;
    return $self->_compiled()->( { ( map { "V" . $_ => $vars{$_} } $self->variables ) } );
}

sub check {
    my ($self) = @_;

    my @variables = $self->schema->resultset('Variable')->search({id => [$self->variables]} )->all;

    $self->_check_period(\@variables)

}

sub _check_period {
    my ($self, $arr) = @_;

    my $periods = {};
    $periods->{$_->period()}++ foreach (@$arr);

    die 'variables with mixed period not allowed! IDs: ' .
        join (keys %$periods) if keys %$periods > 1;
}

1;