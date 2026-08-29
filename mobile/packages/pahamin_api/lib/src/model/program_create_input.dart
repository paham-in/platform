//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'program_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramCreateInput {
  /// Returns a new [ProgramCreateInput] instance.
  ProgramCreateInput({

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
    bool operator ==(Object other) => identical(this, other) || other is ProgramCreateInput &&
      other.description == description &&
      other.name == name;

    @override
    int get hashCode =>
        description.hashCode +
        name.hashCode;

  factory ProgramCreateInput.fromJson(Map<String, dynamic> json) => _$ProgramCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

