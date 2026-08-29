//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'program_update_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramUpdateInput {
  /// Returns a new [ProgramUpdateInput] instance.
  ProgramUpdateInput({

     this.description,

     this.name,
  });

  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ProgramUpdateInput &&
      other.description == description &&
      other.name == name;

    @override
    int get hashCode =>
        description.hashCode +
        name.hashCode;

  factory ProgramUpdateInput.fromJson(Map<String, dynamic> json) => _$ProgramUpdateInputFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramUpdateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

