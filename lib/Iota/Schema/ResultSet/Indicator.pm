
package Iota::Schema::ResultSet::Indicator;

use namespace::autoclean;

use Moose;
extends 'DBIx::Class::ResultSet';
with 'Iota::Role::Verification';
with 'Iota::Schema::Role::InflateAsHashRef';
use Text2URI;
my $text2uri = Text2URI->new();    # tem lazy la, don't worry

use Data::Verifier;
use Iota::IndicatorFormula;

use Iota::Types qw /VisibilityLevel/;

sub _build_verifier_scope_name { 'indicator' }

sub visibility_level_post_check {
    my $r = shift;
    my $lvl = $r->get_value('visibility_level');
    return 1 if $lvl eq 'public';

    return 1 if $lvl eq 'private' && ($r->get_value('visibility_user_id')||'') =~ /^\d+$/;
    return 1 if $lvl eq 'country' && ($r->get_value('visibility_country_id')||'') =~ /^\d+$/;
    return 1 if $lvl eq 'restrict' && ($r->get_value('visibility_users_id')||'') =~ /^(?:(?:\d*,?)\d+)+$/;

    return 0;
}

sub verifiers_specs {
   my $self = shift;
   return {
      create => Data::Verifier->new(
            profile => {
               name    => { required => 1, type => 'Str' },
               formula => {
                  required   => 1,
                  type       => 'Str',
                  post_check => sub {
                        my $r = shift;
                        my $f = eval {
                           new Iota::IndicatorFormula(
                              formula => $r->get_value('formula'),
                              schema  => $self->result_source->schema
                           );
                        };
                        return $@ eq '';
                  },
               },
               goal    => { required => 0, type => 'Num' },
               axis_id => {
                  required   => 1,
                  type       => 'Int',
                  post_check => sub {
                    my $r = shift;
                    my $axis =
                    $self->result_source->schema->resultset('Axis')->find( { id => $r->get_value('axis_id') } );
                    return defined $axis;
                  }
               },
               user_id      => { required => 1, type => 'Int' },
               source       => { required => 0, type => 'Str' },
               explanation  => { required => 0, type => 'Str' },
               observations => { required => 0, type => 'Str' },

               goal_source   => { required => 0, type => 'Str' },
               tags          => { required => 0, type => 'Str' },
               goal_operator => { required => 0, type => 'Str' },
               chart_name    => { required => 0, type => 'Str' },

               goal_explanation => { required => 0, type => 'Str' },
               sort_direction   => { required => 0, type => 'Str' },

               variety_name    => { required => 0, type => 'Str' },
               indicator_type  => { required => 0, type => 'Str' },

               all_variations_variables_are_required => { required => 0, type => 'Bool' },
               summarization_method => { required => 0, type => 'Str' },


               dynamic_variations  => { required => 0, type => 'Bool' },


               visibility_level       => { required => 1, type => VisibilityLevel,
                    post_check => \&visibility_level_post_check
               },
               visibility_user_id     => { required => 0, type => 'Int' },
               visibility_country_id  => { required => 0, type => 'Int' },
               visibility_users_id    => { required => 0, type => 'Str' },

            },
      ),

      update => Data::Verifier->new(
            profile => {
               id      => { required => 1, type => 'Int' },
               name    => { required => 0, type => 'Str' },
               formula => {
                  required   => 0,
                  type       => 'Str',
                  post_check => sub {
                        my $r = shift;
                        my $f = eval {
                           new Iota::IndicatorFormula(
                              formula => $r->get_value('formula'),
                              schema  => $self->result_source->schema
                           );
                        };
                        return $@ eq '';
                  },
               },
               goal    => { required => 0, type => 'Num' },
               axis_id => {
                  required   => 0,
                  type       => 'Int',
                  post_check => sub {
                        my $r = shift;
                        my $axis =
                        $self->result_source->schema->resultset('Axis')->find( { id => $r->get_value('axis_id') } );
                        return defined $axis;
                     }
               },
               source       => { required => 0, type => 'Str' },
               explanation  => { required => 0, type => 'Str' },
               observations => { required => 0, type => 'Str' },

               goal_source   => { required => 0, type => 'Str' },
               tags          => { required => 0, type => 'Str' },
               goal_operator => { required => 0, type => 'Str' },

               goal_explanation => { required => 0, type => 'Str' },
               sort_direction   => { required => 0, type => 'Str' },
               chart_name       => { required => 0, type => 'Str' },

               variety_name    => { required => 0, type => 'Str' },
               indicator_type  => { required => 0, type => 'Str' },

               all_variations_variables_are_required => { required => 0, type => 'Bool' },
               summarization_method => { required => 0, type => 'Str' },


               dynamic_variations  => { required => 0, type => 'Bool' },

               visibility_level       => { required => 0, type => VisibilityLevel,
                    post_check => \&visibility_level_post_check
               },
               visibility_user_id     => { required => 0, type => 'Int' },
               visibility_country_id  => { required => 0, type => 'Int' },
               visibility_users_id    => { required => 0, type => 'Str' },

            },
      ),

   };
}

sub action_specs {
   my $self = shift;
   return {
      create => sub {
            my %values = shift->valid_values;
            do { delete $values{$_} unless defined $values{$_} }
            for keys %values;
            return unless keys %values;
            $values{name_url} = $text2uri->translate( $values{name} );


            my $visibility_users_id = delete $values{visibility_users_id};
            my @visible_users = $visibility_users_id ? split /,/, $visibility_users_id : ();

            my $var = $self->create( \%values );

            if ($values{visibility_level} eq 'restrict'){


                $var->add_to_indicator_user_visibilities( {
                    user_id => $_,
                    created_by => $var->user_id
                }) for @visible_users;

            }

            $var->discard_changes;
            return $var;
      },
      update => sub {
            my %values = shift->valid_values;

            $values{name_url} = $text2uri->translate( $values{name} ) if $values{name};
            do { delete $values{$_} unless defined $values{$_} }
            for keys %values;
            return unless keys %values;

            do { $values{$_} = undef unless exists $values{$_} }
               for qw/
               goal goal_source goal_explanation goal_operator
               tags source observations
            /;


            my $visibility_users_id = delete $values{visibility_users_id};
            my @visible_users = $visibility_users_id ? split /,/, $visibility_users_id : ();

            my $var = $self->find( delete $values{id} )->update( \%values );
            if (exists $values{visibility_level}){
                if ($values{visibility_level} eq 'restrict'){


                    $var->indicator_user_visibilities->delete;

                    $var->add_to_indicator_user_visibilities( {
                        user_id => $_,
                        created_by => $var->user_id
                    }) for @visible_users;

                }

            }
            $var->discard_changes;
            return $var;
      },

   };
}

1;
